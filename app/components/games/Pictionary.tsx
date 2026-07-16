"use client";

import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useStageGame } from "@/app/components/useStageGame";

type Point={x:number;y:number;draw:boolean};
type State={phase:"lobby"|"drawing"|"result"|"finished";players:string[];drawerId:string;word:string;privateWord?:string;points:Point[];guesses:Array<{userId:string;text:string}>;round:number;scores:Record<string,number>;winner:string;deadline:number;viewerId?:string};
const empty=():State=>({phase:"lobby",players:[],drawerId:"",word:"",points:[],guesses:[],round:0,scores:{},winner:"",deadline:0});
const toPath=(points:Point[])=>points.reduce((value,item)=>`${value}${item.draw?" L":" M"}${item.x} ${item.y}`,"");

export default function Pictionary({sessionId,onSave,role}:{partyId:string;sessionId?:string|null;onSave:(score:number)=>void;role?:"stage"|"controller"}) {
  const stageRole=role==="stage"; const stage=useStageGame<State>(stageRole?sessionId??null:null,empty); const controller=useControllerGame<State>(!stageRole?sessionId??null:null,empty()); const state=stageRole?stage.state:controller.state; const send=stageRole?stage.sendAction:controller.sendAction;
  const [guess,setGuess]=useState(""); const drawing=useRef(false); const pending=useRef<Point[]>([]); const done=useRef(false); const me=state.viewerId??""; const canDraw=me===state.drawerId; const path=toPath(state.points);
  useEffect(()=>{if(!stageRole||state.phase!=="finished"||done.current)return;done.current=true;stage.complete();onSave(Math.max(0,...Object.values(state.scores)))},[onSave,stage,stageRole,state.phase,state.scores]);
  const point=(event:PointerEvent<SVGSVGElement>,draw:boolean)=>{if(!canDraw||state.phase!=="drawing")return;const rect=event.currentTarget.getBoundingClientRect();pending.current.push({x:Math.round((event.clientX-rect.left)/rect.width*600),y:Math.round((event.clientY-rect.top)/rect.height*360),draw});if(pending.current.length>=5||!draw){send("stroke",{points:pending.current});pending.current=[];}};
  return <section className="party-game-board game-board-enter drawing-game"><span className="game-step">DRAW & GUESS · {state.round}</span>{state.phase==="lobby"&&<><h3>Рисуй, угадывай, собирай очки</h3><p>Игроков в лобби: {state.players.length}</p>{stageRole&&<button className="demo-action demo-action--lime" onClick={()=>send("start")} type="button">Старт раунда</button>}</>}{state.phase!=="lobby"&&<><p>{canDraw?`Рисуй: ${state.privateWord??""}`:"Угадывай слово по рисунку"}</p><svg className="drawing-canvas" viewBox="0 0 600 360" onPointerDown={(event)=>{drawing.current=true;point(event,false)}} onPointerMove={(event)=>{if(drawing.current)point(event,true)}} onPointerUp={(event)=>{drawing.current=false;point(event,false)}}><path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="7"/></svg>{state.phase==="drawing"&&!canDraw&&<div className="bs-input-group"><input className="bs-input" value={guess} onChange={(event)=>setGuess(event.target.value)} placeholder="Твой вариант"/><button className="demo-action demo-action--lime" onClick={()=>{if(guess.trim()){send("guess",{text:guess.trim()});setGuess("")}}} type="button">Угадать</button></div>}<div className="drawing-guesses">{state.guesses.map((item,index)=><span key={`${item.userId}-${index}`}>{item.userId.slice(-5)}: {item.text}</span>)}</div>{stageRole&&state.phase==="result"&&<button className="demo-action demo-action--lime" onClick={()=>send(state.round>=5?"finish":"next")} type="button">{state.round>=5?"Завершить":"Следующий раунд"}</button>}</>}{sessionId&&<span className="multiplayer-badge">LIVE</span>}</section>;
}
