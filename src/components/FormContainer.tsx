import FormModal from "./FormModal";
import prisma from "@/lib/prisma";


export type FormContainerProps = {
    
  table:
    | "member"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  relatedData?: any; // <- ADICIONE ESTA LINHA
}

const FormContainer = async ({table, type,  data,  id,} : FormContainerProps) => {

  let relatedData = {}
if(type != "delete") {
  switch(table) {
  case "subject":
    const subjectMembers = await prisma.membro.findMany({
      select:{ id:true, nome:true, sobrenome: true},
    });
    relatedData = {members: subjectMembers};
    break;

    default:
      break;
      }
}

return (
    <div className=""><FormModal table={table} type={type} data={data} id={id}  relatedData={relatedData}/> </div>
)
}

export default FormContainer