import { IoIosCloseCircle } from "react-icons/io";

function ResultAddSpaceMessage({addSpaceMessage, setCloseAddSpaceMessage}) {

    return(
       
            <div className="relative z-[500] w-full h-full flex items-center">
                <div className="absolute right-1/8 z-[500] flex flex-col justify-center bg-sky-200 rounded-lg border-[2px] w-1/5 p-2">
                    <IoIosCloseCircle className="text-[20px] text-red-400 hover:cursor-pointer"
                        onClick={() => {
                            setCloseAddSpaceMessage(true);
                        }} />
                    {addSpaceMessage.success ?
                        <div className="flex flex-col items-center p-4 gap-4 w-full bg-white rounded-lg border-[2px]">
                            <h1 className="text-[22px] text-sky-400 ">Success</h1>
                            <span className="text-[15px]">{addSpaceMessage.success}</span>
                        </div> :

                        <div className="flex flex-col items-center p-4 gap-4 w-full bg-white rounded-lg border-[2px] border-[2px]">
                            <h1 className="text-[22px] text-red-400">Error</h1>
                            <span className="text-[15px]">{addSpaceMessage.error}</span>
                        </div>

                    }
                </div>
            </div>
            
                )

}

export default ResultAddSpaceMessage