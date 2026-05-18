import React, { ChangeEvent,DragEvent, useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '../../ui/card'

import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { Button } from '../../ui/button';
import UploadPreview from './UploadPreview';
import { cn } from '@/lib/utils';
import { MediaFile } from './CreatePostDialog';

export interface uploadPreview extends MediaFile {
    url?:string
}
const UploadFile = ({setHasUploaded,setMediaFiles,isSubmitting,mediaFiles}:{setHasUploaded:React.Dispatch<React.SetStateAction<boolean>>; setMediaFiles:React.Dispatch<React.SetStateAction<MediaFile[]>>; isSubmitting:boolean,mediaFiles:MediaFile[] | null}) => {
    const fileRef = useRef<HTMLInputElement>(null)
    const [previews,setPreviews] = useState<uploadPreview[]>([])
    const [isDragging,setIsDragging] = useState(false)
    const [unsupported,setUnsupported] = useState<boolean>(false)

    const supportFiles = ['image/png', 'image/jpeg', 'image/tiff', 'video/mp4']


    const handleSelectFile = ()=>{
        fileRef.current?.click()
    }
   useEffect(() => {
        if (!mediaFiles || mediaFiles.length === 0) return;

        // Create all URLs at once
        console.log(mediaFiles)
        const newPreviews = mediaFiles.map((file) => ({
            ...file,
            url: URL.createObjectURL(file.file),
            id:file.id
        }));

        setPreviews((prev) => [...prev, ...newPreviews]);
        setHasUploaded(true);

        // Memory Cleanup
        // return () => {
        //     newPreviews.forEach(p => URL.revokeObjectURL(p.url));
        // };
        }, [mediaFiles]);
    const handleOnchange = (e:ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (!e.target.files)return;
        const files = Array.from(e.target.files).map(file => ({
            file,
            // Store this once!
            preview: URL.createObjectURL(file), 
            id: `${file.name}-${file.size}` 
        }));
        setMediaFiles(files.map(file=>{
            return {
                file:file.file,
                id:file.id
            }
        }));   
        setPreviews(files.map(file=>{
            return {
                file:file.file,
                id:file.id,
                url:file.preview
            }
        }))


    }
    const handleDrop = (e:DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        if(e.dataTransfer){

            e.dataTransfer.dropEffect = 'link'
        }
        const files = e.dataTransfer?.files
        if(files && files.length > 0 ){
            const newFiles = Array.from(files).map(file => {
                if(!supportFiles.includes(file.type)) return;
                return {

                    file,
                    // Store this once!
                    preview: URL.createObjectURL(file), 
                    id: `${file.name}-${file.size}` 
                }
        });
        setMediaFiles(newFiles.map(file=>{
            return {
                file:file?.file!,
                id:file!.id
            }
        }));   
        setPreviews(newFiles?.map(file=>{
            return {
                file:file?.file!,
                id:file!.id!,
                url:file!.preview
            }
        }))
        }

    }
    const handleDragOver = (e:DragEvent<HTMLDivElement>) =>{
        e.preventDefault()
        setIsDragging(true)
    }
    const handleDragLeave = (e:DragEvent<HTMLDivElement>) =>{
        e.preventDefault()
        setIsDragging(false)

    }
  return (
    <div className='h-full rounded-l-[24px] p-12 '>
        {
            previews && previews.length > 0 ? (
                <div className='rounded-md  w-full shadow-2xl'>
                    <UploadPreview previews={previews} setMediaFiles={setMediaFiles}/>
                </div>
            ) : (
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={cn(`h-full rounded-l-[24px] border-2 ${isDragging ? 'border-[#BA9EFF]' : 'border-[#484849]/20'} border-dashed bg-transparent `,unsupported && 'border-red-500 cursor-not-allowed')}>

                    <Card className='h-full border-dashed border-2 border-[#484849]  bg-transparent flex flex-col items-center justify-center space-y-6'>
                        <div className='size-20 shadow-[0px_0px_50px_0px_#BA9EFF] rounded-full bg-[#201F21] flex items-center justify-center'>
                            <MdOutlineAddPhotoAlternate className='text-xl text-[#BA9EFF]'/>
                        </div>
                        <div   className='text-center mx-auto'>
                            <h2 className='font-bold text-3xl text-white mb-2'>
                                    {isDragging ? "Drop files here" : "Drop your masterpiece"}
                            </h2>
                            <p className='text-[#ADAAAB] text-lg max-w-78 mx-auto'>Upload high-res digital art or motion pieces</p>
                            <p className='text-[#767576] text-sm'>Supports PNG, TIFF, or MP4 up to 100MB</p>
                        </div>
                        <Button disabled={isSubmitting} onClick={handleSelectFile} className='bg-[linear-gradient(90deg,#BA9EFF,#8455EF)] shadow-[0px_0px_20px_0px_#BA9EFF] rounded-[12px] border-none px-8! py-6! text-sm text-[#2B006E] disabled:opacity-50 disabled:cursor-not-allowed'>
                            {isSubmitting ? 'Uploading...' : 'Select from Device'}
                        </Button>
                    </Card>
                </div>
                
            )
        }
        <input
         onChange={handleOnchange}
         type="file" 
         ref={fileRef} 
         className='hidden' 
         accept='image/png, image/jpeg, image/tiff, video/mp4' 
         multiple />
    </div>
  )
}

export default UploadFile