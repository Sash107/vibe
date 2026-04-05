from langchain_openrouter import ChatOpenRouter
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Literal, List
from fastapi.responses import StreamingResponse
from langchain.messages import HumanMessage,SystemMessage,AIMessage
from System_Prompt import SYSTEM_PROMPT
from dotenv import load_dotenv
from langchain_deepseek import ChatDeepSeek

load_dotenv()

class chat(BaseModel):
    role:Literal["user","assistant","system"]
    content:str

class chatMessages(BaseModel):
    messages:List[chat]

app=FastAPI()

llm = ChatDeepSeek(
    model="deepseek-reasoner",
    temperature=0.1,
    max_tokens=None,
    timeout=None,
)

model=ChatOpenRouter(
    model="stepfun/step-3.5-flash:free",
    temperature=0
)

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

def ask_llm(messages):
    buffer=""
    final_message=[SystemMessage(content=SYSTEM_PROMPT)]+messages
    try:
        for chunk in llm.stream(final_message):
            if chunk.content:
                buffer+=chunk.content
                lines=buffer.split('\n')
                for line in lines[:-1]:
                    yield line + '\n'
                    print(line)
                buffer=lines[-1]

        if(buffer):
            yield buffer
            print(buffer)
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(error_msg)
        yield error_msg

@app.post('/ask_llm')
def stream(request:chatMessages):
    final_messages=convertMessages(request.messages)
    print(request)
    return StreamingResponse(ask_llm(final_messages))