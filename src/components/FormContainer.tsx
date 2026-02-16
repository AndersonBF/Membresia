import FormModal from "./FormModal";
import prisma from "@/lib/prisma";

export type TableType = "member" | "assignment" | "result" | "attendance" | "event" | "announcement" | "document";

export type FormContainerProps = {
  table: TableType;
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  relatedData?: any;
}

const FormContainer = async ({table, type, data, id, relatedData: passedRelatedData}: FormContainerProps) => {

  let relatedData = passedRelatedData || {}; // ✅ Usa o relatedData passado como prop
  
  if(type !== "delete") {
    switch(table) {
      case "member":
        // Se member precisar de algum related data, adicione aqui
        // Por exemplo:
        // const roles = await prisma.role.findMany();
        // relatedData = {roles};
        break;

      case "event":
        // ✅ Se não veio relatedData passado, busca aqui como fallback
        if (!passedRelatedData?.societies) {
          const societies = await prisma.internalSociety.findMany({
            select: {
              id: true,
              name: true,
            },
            orderBy: {
              name: 'asc',
            },
          });
          relatedData = { ...relatedData, societies };
        }
        break;

      // Adicione outros cases conforme necessário
    
      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal 
        table={table} 
        type={type} 
        data={data} 
        id={id} 
        relatedData={relatedData}
      /> 
    </div>
  )
}

export default FormContainer;