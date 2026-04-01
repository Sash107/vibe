from langchain_openrouter import ChatOpenRouter
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Literal, List
from fastapi.responses import StreamingResponse
from langchain.messages import HumanMessage,SystemMessage,AIMessage
from System_Prompt import SYSTEM_PROMPT
from dotenv import load_dotenv

load_dotenv()

class chat(BaseModel):
    role:Literal["user","assistant","system"]
    content:str

class chatMessages(BaseModel):
    messages:List[chat]

app=FastAPI()

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
    for chunk in model.stream(final_message):
        if chunk.content:
            buffer+=chunk.content
            lines=buffer.split('\n')
            for line in lines[:-1]:
                yield line
                print(line)
            buffer=lines[-1]
            
    if(buffer):
        yield buffer
        print(buffer)

@app.post('/ask_llm')
def stream(request:chatMessages):
    final_messages=convertMessages(request.messages)
    print(request)
    return StreamingResponse(ask_llm(final_messages))