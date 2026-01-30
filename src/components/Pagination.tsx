"use client"

const Pagination = () => {
  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
        <button className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disable:cursos-not-allowed">
            Prev</button>
        <div className="flex items-center ">
            <button className="px-2 rounded-sm bg-lamaSky">1</button>
             <button className="px-2 rounded-sm bg-lamaSky">2</button>
              <button className="px-2 rounded-sm bg-lamaSky">3</button>
              ...
              <button className="px-2 rounded-sm">10</button>
        </div> 
        <button className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursos-not-allowed">
            Next
        </button>
    </div>
  )
}

export default Pagination