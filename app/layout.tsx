import type { Metadata } from 'next';
import './globals.css';
import './mobile.css';
import './photo.css';
import './category.css';
export const metadata:Metadata={
 metadataBase:new URL('https://casa-do-pescador-gestao.lucas-27-ant-onio-f.chatgpt.site'),
 title:'Casa do Pescador | Gestão da Loja',
 description:'Painel de gestão de vendas, estoque, clientes e fornecedores da Casa do Pescador.',
 openGraph:{title:'Casa do Pescador | Gestão da Loja',description:'Gestão inteligente para sua loja de pesca.',images:[{url:'/og.png',width:1536,height:1024,alt:'Casa do Pescador — Gestão inteligente para sua loja'}]},
 twitter:{card:'summary_large_image',title:'Casa do Pescador | Gestão da Loja',description:'Gestão inteligente para sua loja de pesca.',images:['/og.png']}
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
