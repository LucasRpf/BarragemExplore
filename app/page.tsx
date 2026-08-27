'use client';
import { useMemo, useState } from 'react';

const logo='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVcnlN3uOioo77eVBcT6sQHM4hErp_36PgFw8_qbadEKuIKMxqO7RJZsTZ&s=10';
const products=[
 {name:'Vara Marine Sports Evolution',sku:'VAR-001',category:'Varas',stock:18,price:289.9,status:'Em estoque'},
 {name:'Molinete Shimano Sienna 2500',sku:'MOL-018',category:'Molinetes',stock:4,price:449.9,status:'Estoque baixo'},
 {name:'Linha Multifilamento 0,30mm',sku:'LIN-042',category:'Linhas',stock:36,price:79.9,status:'Em estoque'},
 {name:'Isca Artificial Meia Água',sku:'ISC-107',category:'Iscas',stock:0,price:42.5,status:'Esgotado'},
];
const nav=['Visão geral','Produtos','Vendas','Clientes','Fornecedores','Relatórios'];

export default function Home(){
 const [active,setActive]=useState('Visão geral'); const [query,setQuery]=useState(''); const [notice,setNotice]=useState('');
 const filtered=useMemo(()=>products.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())),[query]);
 const feedback=(message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(''),2500)};
 return <main className="app-shell">
  <aside className="sidebar">
   <div className="brand"><img src={logo} alt="Logo Casa do Pescador"/><div><strong>Casa do Pescador</strong><span>Gestão da loja</span></div></div>
   <nav aria-label="Menu principal">{nav.map((item,i)=><button key={item} className={active===item?'active':''} onClick={()=>setActive(item)}><i>{['⌂','▣','↗','♙','◇','▥'][i]}</i>{item}</button>)}</nav>
   <div className="side-bottom"><button><i>⚙</i>Configurações</button><div className="profile"><b>AP</b><span><strong>André Pescador</strong><small>Administrador</small></span><em>⋮</em></div></div>
  </aside>
  <section className="content">
   <header className="topbar"><div><p>Quinta-feira, 27 de agosto</p><h1>{active}</h1></div><div className="actions"><button className="bell" aria-label="Notificações">♢<i/></button><button className="primary" onClick={()=>feedback('Nova venda iniciada')}>＋ Nova venda</button></div></header>
   <div className="dashboard">
    <section className="stats">
     <article><div className="stat-head"><i className="ico green">↗</i><small>Hoje</small></div><p>Vendas do dia</p><strong>R$ 3.284,50</strong><span className="up">↑ 12,5% <em>vs. ontem</em></span></article>
     <article><div className="stat-head"><i className="ico blue">▣</i><small>Hoje</small></div><p>Pedidos</p><strong>24</strong><span className="up">↑ 8,2% <em>vs. ontem</em></span></article>
     <article><div className="stat-head"><i className="ico amber">!</i><small>Atenção</small></div><p>Estoque baixo</p><strong>8 itens</strong><button className="link" onClick={()=>setActive('Produtos')}>Ver produtos →</button></article>
     <article><div className="stat-head"><i className="ico violet">♙</i><small>Este mês</small></div><p>Novos clientes</p><strong>38</strong><span className="up">↑ 5,1% <em>vs. mês anterior</em></span></article>
    </section>
    <section className="middle">
     <article className="panel sales"><Title title="Desempenho de vendas" subtitle="Receita dos últimos 7 dias"><select><option>Últimos 7 dias</option><option>Últimos 30 dias</option></select></Title><div className="chart-summary"><div><span>Receita total</span><strong>R$ 18.740,80</strong></div><span className="up pill">↑ 9,8%</span></div><div className="chart">{[42,58,46,72,64,91,78].map((h,i)=><div className="bar" key={i}><span>{i===5?'4,2k':''}</span><i style={{height:`${h}%`}}/><small>{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][i]}</small></div>)}</div></article>
     <article className="panel categories"><Title title="Vendas por categoria" subtitle="Distribuição neste mês"><button>•••</button></Title><div className="donut"><div><strong>R$ 54,2k</strong><span>Total</span></div></div><div className="legend">{[['Varas e Molinetes','38%','navy'],['Iscas','26%','lime'],['Linhas e Anzóis','21%','sky'],['Acessórios','15%','sand']].map(x=><div key={x[0]}><span><i className={x[2]}/>{x[0]}</span><strong>{x[1]}</strong></div>)}</div></article>
    </section>
    <section className="panel inventory"><div className="inventory-head"><Title title="Controle de estoque" subtitle="Acompanhe os produtos que precisam de atenção"/><div className="tools"><label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar produto..."/></label><button onClick={()=>setActive('Produtos')}>Ver estoque completo →</button></div></div><div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Preço</th><th>Status</th><th/></tr></thead><tbody>{filtered.map((p,i)=><tr key={p.sku}><td><b className={`thumb p${i}`}>◈</b><div><strong>{p.name}</strong><small>SKU: {p.sku}</small></div></td><td>{p.category}</td><td><strong>{p.stock} un.</strong></td><td>R$ {p.price.toFixed(2).replace('.',',')}</td><td><span className={`status ${p.status==='Em estoque'?'ok':p.status==='Esgotado'?'out':'low'}`}>● {p.status}</span></td><td><button>•••</button></td></tr>)}</tbody></table></div></section>
   </div>
  </section>{notice&&<div className="toast" role="status">✓ {notice}</div>}
 </main>
}

function Title({title,subtitle,children}:{title:string;subtitle:string;children?:React.ReactNode}){return <div className="panel-title"><div><h2>{title}</h2><p>{subtitle}</p></div>{children}</div>}
