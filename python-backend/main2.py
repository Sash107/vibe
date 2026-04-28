import httpx
from langchain_core.tools import tool
from pydantic import BaseModel
from typing import TypedDict, Annotated,Literal,List
from langchain_deepseek import ChatDeepSeek
from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
from fastapi import FastAPI
from System_Prompt2 import SYSTEM_PROMPT

load_dotenv()

TOOL_SERVER="http://localhost:5000"

app=FastAPI()

class chat(BaseModel):
    role:Literal["user","assistant","system"]
    content:str

class chatMessages(BaseModel):
    projectId: str 
    messages:List[chat]

class AgentState(TypedDict):
    messages:Annotated[list,add_messages]
    files:dict
    summary:str

def convertMessages(messages):
    result=[]
    for msg in messages:
        if(msg.role=='user'):
            result.append(HumanMessage(content=msg.content))
        if(msg.role=='assistant'):
            result.append(AIMessage(content=msg.content))
        if(msg.role=='system'):
            result.append(SystemMessage(content=msg.content))
    return result
def make_tools(projectId: str):

    @tool
    async def terminal(command:str,path:str="")->str:
        """Run a shell command in the sandbox."""
        print(f"Progress: Running terminal command: {command} in path: {path}")
        async with httpx.AsyncClient(timeout=None) as client:
            r = await client.post(f"{TOOL_SERVER}/tools/runCommand",
                     json={
                         "command":command,
                         "path":path
                     },
                     headers={
                         "x-project-id":projectId
                     },
                     )
        return r.json().get("output", "")
    
    @tool
    async def create_or_update_files(files:list[dict]):
        """Create or update files. Each item must have 'path' and 'content'."""
        print(f"Progress: Creating/updating {len(files)} files")
        async with httpx.AsyncClient(timeout=None) as client:
            r = await client.post(f"{TOOL_SERVER}/tools/create-file",
                     json={
                         "files":files
                     },
                     headers={
                        "x-project-id":projectId 
                     }
                     )
        data=r.json()
        return data.get("output","")
    
    @tool
    async def read_files(files:list[dict]):
        """Read files from the sandbox by path."""
        print(f"Progress: Reading {len(files)} files")
        async with httpx.AsyncClient(timeout=None) as client:
            r = await client.post(f"{TOOL_SERVER}/tools/readFiles",
                     json={
                         "files":files
                     },
                     headers={
                        "x-project-id":projectId 
                     }
                     )
        data=r.json()
        return data.get("output","")
    return [terminal, create_or_update_files, read_files]
        

def build_graph(projectId: str):
    tools=make_tools(projectId)
    llm2=ChatDeepSeek(
        model="deepseek-reasoner",
        temperature=0,
        max_tokens=None,
        timeout=None,
    )
    llm_with_tools=llm2.bind_tools(tools)
    
    async def call_model(state:AgentState):
        recent_messages = state["messages"]
        response = await llm_with_tools.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT), *recent_messages])
        new_files={}
        if response.tool_calls:
            tool_names = [tc["name"] for tc in response.tool_calls]
            print(f"Progress: Model decided to call tools: {tool_names}")
        else:
            print("Progress: Model provided final response")

        summary=""
        if isinstance(response.content,str) and "<task_summary>" in response.content:
            summary=response.content
            print(f"Progress: Task completed with summary: {summary[:100]}...")

        return {
            "messages":[response],
            "files":{**state.get("files", {}), **new_files},
            "summary":summary
        }
    
    def should_continue(state:AgentState):
        if state.get("summary"):
            print("Progress: Ending graph due to summary found")
            return END
        last=state["messages"][-1]
        if getattr(last,"tool_calls",None):
            print("Progress: Continuing to tools")
            return "tools"
        else:
            print("Progress: Model provided response without summary, continuing to validate")
            return "agent"
    
    tool_node=ToolNode(tools)

    graph=(
        StateGraph(AgentState)
        .add_node("agent",call_model)
        .add_node("tools",tool_node)
        .add_edge(START,"agent")
        .add_conditional_edges("agent",should_continue)
        .add_edge("tools","agent")
        .compile()
    )

    return graph

async def run_agent(conversation: list,projectId: str):
    graph = build_graph(projectId)
    result= await graph.ainvoke({
        "messages": conversation,
        "files":{},
        "summary":""
    })
    return result

@app.post('/call_llm')
async def ask_llm(request:chatMessages):
    conversation=convertMessages(request.messages)
    result = await run_agent(conversation,request.projectId)
    return result
