'use client';
import {BrowserMultiFormatReader} from '@zxing/browser';
import {useEffect,useRef,useState} from 'react';

export default function BarcodeReader(){
 const video=useRef<HTMLVideoElement>(null);const reader=useRef<BrowserMultiFormatReader|null>(null);const [visible,setVisible]=useState(false);const [active,setActive]=useState(false);const [message,setMessage]=useState('');
 useEffect(()=>{const id=window.setInterval(()=>setVisible(!!document.querySelector('.edit-sheet,.sale-sheet')),300);return()=>window.clearInterval(id)},[]);
 useEffect(()=>{if(!active||!video.current)return;const scanner=new BrowserMultiFormatReader();reader.current=scanner;scanner.decodeFromConstraints({video:{facingMode:{ideal:'environment'}}},video.current,(result)=>{if(!result)return;const code=result.getText();const sku=document.querySelectorAll<HTMLInputElement>('.form-grid input:not([type=file])')[1];if(sku){const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;set?.call(sku,code);sku.dispatchEvent(new Event('input',{bubbles:true}));setMessage('Código preenchido no cadastro.');setActive(false);return}const search=document.querySelector<HTMLInputElement>('.sale-search input');if(search){const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;set?.call(search,code);search.dispatchEvent(new Event('input',{bubbles:true}));window.setTimeout(()=>{(document.querySelector('.quick-product-list button') as HTMLButtonElement|null)?.click()},120);setMessage('Produto adicionado à venda.');setActive(false)}});return()=>scanner.reset()},[active]);
 useEffect(()=>{if(!active)reader.current?.reset()},[active]);
 if(!visible)return null;
 return <div className="barcode-reader"><button type="button" className="scan-button" onClick={()=>setActive(x=>!x)}>{active?'■ Parar câmera':'▣ Ler código de barras'}</button>{active&&<video ref={video} autoPlay playsInline/>}{message&&<small>{message}</small>}</div>
}
