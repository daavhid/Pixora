import React, { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react'
import { uploadPreview } from '../feeds/UploadFile'
import { MediaFile } from '../feeds/CreatePostDialog'
import UploadPreview from '../feeds/UploadPreview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

interface Props {
    mediaFiles:MediaFile[];
    setMediaFiles:React.Dispatch<React.SetStateAction<MediaFile[]>>;
    setHasUploaded:React.Dispatch<React.SetStateAction<boolean>>;
    isSubmitting:boolean
}

const UploadStory = ({mediaFiles,setMediaFiles,setHasUploaded,isSubmitting}:Props) => {
    const fileRef = useRef<HTMLInputElement>(null)
    const [previews,setPreviews] = useState<uploadPreview[]>([])
    const [isDragging,setIsDragging] = useState(false)
    const [unsupported,setUnsupported] = useState<boolean>(false)
    const supportFiles = ['image/png', 'image/jpeg', 'image/tiff', 'video/mp4']

    const handleSelectFile = ()=>{
            fileRef.current?.click()
        }
    useEffect(() => {
        // if (!mediaFiles || mediaFiles.length === 0) return;

        // // Create all URLs at once
        // console.log(mediaFiles)
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
    <div className='h-full flex items=center'>
        {
            previews && previews.length > 0 ? (
                <div className='rounded-md h-full  w-full shadow-2xl'>
                    <UploadPreview previews={previews} mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} previewStory={true}/>
                </div>
            ) : (
                <div onClick={handleSelectFile} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={cn(`h-full rounded-l-[24px] border-2 ${isDragging ? 'border-[#BA9EFF]' : 'border-[#484849]/20'} border-dashed bg-transparent `,unsupported && 'border-red-500 cursor-not-allowed')}>

                    <Card className="w-[320px] h-full bg-transparent aspect-[9/16] border-dashed border-2 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/10 transition">
                        <UploadCloud className="w-10 h-10 text-[#8455EF]" />
                        <p className="font-medium text-muted">Upload Story</p>
                        <p className="text-xs text-muted-foreground text-center px-6">
                            Drag & drop or click to upload media
                        </p>
                    </Card>

                    {/* <Card className='h-full border-dashed border-2 border-[#484849]  bg-transparent flex flex-col items-center justify-center space-y-6'>
                        <Button disabled={isSubmitting} onClick={handleSelectFile} className='bg-[linear-gradient(90deg,#BA9EFF,#8455EF)] shadow-[0px_0px_20px_0px_#BA9EFF] rounded-[12px] border-none px-8! py-6! text-sm text-[#2B006E] disabled:opacity-50 disabled:cursor-not-allowed'>
                            {isSubmitting ? 'Uploading...' : 'Select from Device'}
                        </Button>
                    </Card> */}
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

export default UploadStory