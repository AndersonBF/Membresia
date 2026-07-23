const Table = ({
    columns,
    renderRow,
    data,
}:{
    columns:{header:string; accessor:string; className?: string}[];
    renderRow: (item: any) => React.ReactNode;
    data: any[];
}) => {
  return (
    // Rolagem horizontal no celular: sem isso a última coluna (Ações) fica cortada.
    <div className="w-full overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[520px] mt-4">
          <thead>
              <tr className="text-left text-gray-500 text-sm">
              {columns.map((col)=>(
                  // O className da coluna precisa valer também no cabeçalho, senão os
                  // títulos das colunas escondidas no mobile desalinham a tabela.
                  <th key={col.accessor} className={col.className}>{col.header}</th>
              ))}
              </tr>
          </thead>
          <tbody>{data.map((item)=> renderRow(item))}

          </tbody>
      </table>
    </div>
  );
};

export default Table
