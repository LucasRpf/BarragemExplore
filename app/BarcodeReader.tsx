'use client';
import {useEffect,useRef,useState} from 'react';

export default function BarcodeReader(){
 const video=useRef<HTMLVideoElement>(null);const [open,setOpen]=useState(false);const [active,setActive]=useState(false);const [message,setMessage]=useState('');
 useEffect(()=>{const id=window.setInterval(()=>setOpen(!!document.querySelector('.edit-sheet')),350);return()=>window.clearInterval(id)},[]);
 useEffect(()=>{let stream:MediaStream|undefined;let id=0;if(!active)return;const Detector=(window as any).BarcodeDetector;if(!Detector){setMessage('Leitura por câmera não é compatível com este navegador.');return}navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>{stream=s;if(video.current)video.current.srcObject=s;const detector=new Detector();id=window.setInterval(async()=>{try{const code=(await detector.detect(video.current))[0]?.rawValue;if(!code)return;const field=document.querySelectorAll<HTMLInputElement>('.form-grid input:not([type=file])')[1];if(field){const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;set?.call(field,code);field.dispatchEvent(new Event('input',{bubbles:true}));setMessage('Código preenchido.');setActive(false)}}catch{}},650)}).catch(()=>setMessage('Permita o acesso à câmera para continuar.'));return()=>{window.clearInterval(id);stream?.getTracks().forEach(t=>t.stop())}},[active]);
 if(!open)return null;
 return <div className="barcode-reader"><button type="button" className="scan-button" onClick={()=>setActive(x=>!x)}>{active?'■ Parar câmera':'▣ Ler código de barras'}</button>{active&&<video ref={video} autoPlay playsInline/>}{message&&<small>{message}</small>}</div>
}
