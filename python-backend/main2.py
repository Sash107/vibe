import httpx
from langchain_core.tools import tool
from pydantic import BaseModel
from typing import TypedDict, Annotated,Literal,List
from langchain_deepseek import ChatDeepSeek
from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.language_models import LanguageModelInput
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from dotenv import load_dotenv
from fastapi import FastAPI
from System_Prompt2 import SYSTEM_PROMPT

load_dotenv()

TOOL_SERVER="http://localhost:5000"

app=FastAPI()

# class ChatDeepSeekWithReasoning(ChatDeepSeek):
#     """ChatDeepSeek variant that round-trips thinking-mode tool-call metadata."""

#     def _get_request_payload(
#         self,
#         input_: LanguageModelInput,
#         *,
#         stop: list[str] | None = None,
#         **kwargs,
#     ) -> dict:
#         payload = super()._get_request_payload(input_, stop=stop, **kwargs)
#         messages: list[BaseMessage] = self._convert_input(input_).to_messages()

#         for payload_message, message in zip(payload.get("messages", []), messages):
#             if not isinstance(message, AIMessage):
#                 continue

#             reasoning_content = message.additional_kwargs.get("reasoning_content")
#             if reasoning_content is not None:
#                 payload_message["reasoning_content"] = reasoning_content

#         return payload

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


# def valid_chat_history(messages: list[BaseMessage]) -> list[BaseMessage]:
#     """Keep OpenAI-compatible tool-call turns well-formed.

#     An AI message with tool_calls must be followed immediately by one
#     ToolMessage for every tool_call_id. If a turn is incomplete, sending it
#     back to the chat-completions API raises a 400 before the model can answer.
#     """
#     valid_messages: list[BaseMessage] = []
#     i = 0

#     while i < len(messages):
#         message = messages[i]

#         if isinstance(message, ToolMessage):
#             i += 1
#             continue

#         tool_calls = getattr(message, "tool_calls", None)
#         if isinstance(message, AIMessage) and tool_calls:
#             expected_ids = {
#                 tool_call.get("id")
#                 for tool_call in tool_calls
#                 if tool_call.get("id")
#             }
#             tool_messages: list[ToolMessage] = []
#             j = i + 1

#             while j < len(messages) and isinstance(messages[j], ToolMessage):
#                 tool_messages.append(messages[j])
#                 j += 1

#             received_ids = {
#                 tool_message.tool_call_id
#                 for tool_message in tool_messages
#                 if tool_message.tool_call_id
#             }

#             if expected_ids and expected_ids.issubset(received_ids):
#                 valid_messages.append(message)
#                 valid_messages.extend(tool_messages)

#             i = j
#             continue

#         valid_messages.append(message)
#         i += 1

#     return valid_messages


# def valid_file_entries(files: list[dict], require_content: bool = False):
#     valid_files = []
#     invalid_files = []

#     for index, file in enumerate(files or []):
#         if not isinstance(file, dict):
#             invalid_files.append(f"item {index} is not an object")
#             continue

#         path = file.get("path")
#         if not isinstance(path, str) or not path.strip():
#             invalid_files.append(f"item {index} is missing a valid 'path'")
#             continue

#         if require_content and "content" not in file:
#             invalid_files.append(f"item {index} is missing 'content'")
#             continue

#         valid_files.append(file)

#     return valid_files, invalid_files


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
        # files, invalid_files = valid_file_entries(files, require_content=True)
        # if invalid_files:
        #     return (
        #         "Invalid create_or_update_files input. Each file must include "
        #         f"'path' and 'content'. Problems: {', '.join(invalid_files)}"
        #     )
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
        # files, invalid_files = valid_file_entries(files)
        # if invalid_files:
        #     return (
        #         "Invalid read_files input. Each file must include a valid "
        #         f"'path'. Problems: {', '.join(invalid_files)}"
        #     )

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
    
    # # If last message is an AI message without summary, add a nudge
    #     if (recent_messages and 
    #         isinstance(recent_messages[-1], AIMessage) and 
    #         not recent_messages[-1].tool_calls):
    #         recent_messages = recent_messages + [
    #             HumanMessage(content="Please validate your work and provide a <task_summary> when done.")
    #         ]
        response = await llm_with_tools.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT), *recent_messages])
        new_files={}
        # for tc in (response.tool_calls or []):
            # if tc["name"]=="create_or_update_files":
            #     files, invalid_files = valid_file_entries(
            #         tc.get("args", {}).get("files", []),
            #         require_content=True,
            #     )
            #     if invalid_files:
            #         print(
            #             "Progress: Ignoring malformed file entries from model: "
            #             f"{', '.join(invalid_files)}"
            #         )
            #     for f in files:
            #         new_files[f["path"]]=f["content"]

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
        # Always continue unless we have a task summary
        # The model should only provide <task_summary> when validation shows 200
        last=state["messages"][-1]
        if getattr(last,"tool_calls",None):
            print("Progress: Continuing to tools")
            return "tools"
        else:
            print("Progress: Model provided response without summary, continuing to validate")
            # Force continuation by returning to agent node to get more validation
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
