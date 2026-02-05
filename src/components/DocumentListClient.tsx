"use client";

import { useState } from "react";
import FormModal from "./FormModal";
import Image from "next/image";

// Tipagem básica para não dar erro no TypeScript
type DocumentProps = {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  society?: { name: string } | null;
  ministry?: { name: string } | null;
  bibleSchoolClass?: { name: string } | null;
  council?: { id: number } | null;
  diaconate?: { id: number } | null;
};

const DocumentListClient = ({ 
  documents, 
  relatedData 
}: { 
  documents: DocumentProps[]; 
  relatedData: any 
}) => {
  
  // Estado para controlar qual documento está aberto (se null, modal fecha)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  // Função para verificar se é imagem (para renderizar <img> em vez de <iframe>)
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <>
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Documentos e Arquivos</h1>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-4 self-end">
            <FormModal table="document" type="create" relatedData={relatedData} />
          </div>
        </div>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 rounded-md border border-gray-200 bg-lamaSkyLight hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <h2 className="font-bold text-gray-800 text-md truncate pr-2">{doc.title}</h2>
                  <span className="text-[10px] uppercase font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full w-max border border-gray-200 mt-1">
                     {doc.society?.name || doc.ministry?.name || doc.bibleSchoolClass?.name || (doc.council ? "Conselho" : "") || (doc.diaconate ? "Diaconia" : "Geral")}
                  </span>
                </div>
                <FormModal table="document" type="delete" id={doc.id} />
              </div>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 min-h-[3em]">
                {doc.description || "Sem descrição disponível."}
              </p>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex gap-2 mt-2">
              {/* BOTÃO VISUALIZAR (Abre o Modal) */}
              <button 
                onClick={() => setSelectedDoc(doc.fileUrl)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-xs transition-all border border-blue-500 bg-blue-500 text-white hover:bg-white hover:text-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Ler Agora
              </button>

              {/* BOTÃO BAIXAR (Download forçado) */}
              <a 
                href={doc.fileUrl} 
                download 
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-xs transition-all border border-green-700 bg-green-700 text-white hover:bg-white hover:text-green-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m0 0 3-3m-3 3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Baixar
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL DE VISUALIZAÇÃO ================= */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[999] bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-white w-full h-[90vh] md:w-[80%] rounded-lg overflow-hidden relative flex flex-col">
            
            {/* Barra superior do Modal */}
            <div className="flex justify-between items-center p-3 border-b bg-gray-100">
              <h3 className="font-semibold text-gray-700">Visualização de Arquivo</h3>
              <button 
                onClick={() => setSelectedDoc(null)} 
                className="text-gray-500 hover:text-red-600 font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo do Arquivo */}
            <div className="flex-1 bg-gray-200 overflow-auto flex items-center justify-center">
              {isImage(selectedDoc) ? (
                // Se for imagem
                <div className="relative w-full h-full">
                   <Image 
                     src={selectedDoc} 
                     alt="Documento" 
                     fill 
                     className="object-contain" 
                   />
                </div>
              ) : (
                // Se for PDF (iframe funciona como visualizador nativo)
                <iframe 
                  src={selectedDoc} 
                  className="w-full h-full border-none"
                  title="Visualizador de PDF"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentListClient;