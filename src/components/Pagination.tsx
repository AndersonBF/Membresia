"use client"
import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({page, count, perPage}:{page: number, count: number, perPage?: number}) => {

    const router = useRouter()
    const size = perPage && perPage > 0 ? perPage : ITEM_PER_PAGE

    const changePage = (newPage: number) => {
        const params = new URLSearchParams(window.location.search)
        params.set("page", newPage.toString());
        router.push(`${window.location.pathname}?${params}`);
    };

    const hasPrev = size * (page - 1) > 0;
    const hasNext = size * (page - 1) + size < count;

    return (
        <div className="p-4 flex items-center justify-between text-gray-500">
            <button 
                className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasPrev}
                onClick={() => changePage(page - 1)}
            >
                Prev
            </button>
            <div className="flex items-center gap-2">
                {Array.from(
                    { length: Math.ceil(count / size) },
                    (_, index) => {
                        const pageIndex = index + 1;
                        return (
                            <button 
                                key={pageIndex} 
                                className={`px-2 rounded-sm ${page === pageIndex ? "bg-lamaSky" : ""}`}
                                onClick={() => {
                                    changePage(pageIndex);
                                }}  
                            >
                                {pageIndex}
                            </button>
                        );
                    }
                )}
            </div> 
            <button 
                className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasNext}
                onClick={() => changePage(page + 1)}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;