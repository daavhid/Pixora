'use client'
import React, { useState,Fragment, useRef, useEffect } from 'react'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '../../ui/dialog'

import { Textarea } from "../../ui/textarea"
import { Input } from "../../ui/input"
import { FaPlus } from 'react-icons/fa6'
import UploadFile from './UploadFile'
import { LuEye, LuMapPin, LuMessageSquare, LuPlus, LuShieldCheck } from "react-icons/lu";
import { MdClose } from 'react-icons/md'
import { Button } from '../../ui/button'
import { Switch } from '../../ui/switch'
import { Card, CardContent, CardFooter, CardHeader } from '../../ui/card'
import { uploadFilesToCloudinary } from '@/cloudinary/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@/utils/trpc' 
import { useRouter } from 'next/navigation'
import {del, get, set} from 'idb-keyval'
import { Mediatype } from '../../../../backend/generated/prisma/enums'

export interface MediaFile  {
    file:File
    id: string
    width?:number
    height?:number,
    x?:number
    y?:number
    aspect?:number
}

const CreatePostDialog = () => {
    const trpc = useTRPC()
    const queryClient = useQueryClient();

    const infinitePostsQuery = trpc.post.getAllPost.infiniteQueryKey()

    const createPost = useMutation(trpc.post.createPost.mutationOptions())
    const [open,setOpen] = useState(false)
    const [hasUploaded,setHasUploaded] = useState(false)
    const router = useRouter()
    const linkRef = useRef<HTMLAnchorElement>(null)

    const [mediaFiles,setMediaFiles] = useState<MediaFile[]>([])
    const [caption,setCaption] = useState('')
    const [location,setLocation] = useState('')
    const [isSubmitting,setIsSubmitting] = useState(false)

    const [tags, setTags] = useState<string[]>(['Blender', 'Unreal Engine 5'])
    const [showAddTool, setShowAddTool] = useState(false)

   

    // Save/Load Draft from localStorage
    const saveDraft = async() => {
        const draft = {
            caption,
            location,
            tags,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem('pixora-draft', JSON.stringify(draft));
        await set('post-draft-files', mediaFiles);
        alert('Draft saved successfully!');
    };

    const  loadDraft = async () => {
        const saved = localStorage.getItem('pixora-draft');
        const savedFiles = await get<MediaFile[]>('post-draft-files');
        if (savedFiles) {
        setMediaFiles(savedFiles);
        }
        if (saved) {
            const draft = JSON.parse(saved);
            setCaption(draft.caption || '');
            setLocation(draft.location || '');
            setTags(draft.tags || []);
            return true;
        }
        return false;
    };

     useEffect(() => {
        const setDraft = async()=>{
            const loaded = await loadDraft()
            setHasUploaded(loaded)
        }
        setDraft()

    },[])

    const clearDraft = async() => {
        localStorage.removeItem('pixora-draft');
        await del('post-draft-files');
    };

    const availableTools = [
        'Blender', 'Unreal Engine 5', 'Unity', 'Photoshop', 'Illustrator', 
        'After Effects', 'Premiere Pro', 'Maya', 'Cinema 4D', 'ZBrush', 
        'Substance Painter', 'Houdini', 'Nuke', 'DaVinci Resolve'
    ]

    const handleCreatePost = async()=>{
        console.log(mediaFiles, caption, location, tags)


        try{
            setIsSubmitting(true);
            //first upload the images and get a return value
            const uploadedMediaResponse = await uploadFilesToCloudinary(mediaFiles);
            

            if(!uploadedMediaResponse){
                throw new Error("Media upload failed. Please try again.")
            }
            console.log(uploadedMediaResponse,'this is the upload resp')
            createPost.mutateAsync({
                caption,
                location,
                tags,
                medias: uploadedMediaResponse?.map(media=>({
                    url:media.secure_url,
                    type:media.resource_type as Mediatype,
                    width:media.width,
                    height:media.height,
                    duration:media.duration,
                    thumbnail:media.thumbnail_url,
                    altText:media.original_filename,
                    cropWidth:media.cropWidth,
                    cropHeight:media.cropHeight,
                    aspect:media.aspect,
                    x:media.x,
                    y:media.y,
                    publicId:media.public_id,
                    version:media.version,
                    format:media.format


                })) || [],
            },
            {
                onSuccess:async()=>{
                    queryClient.invalidateQueries({ queryKey: infinitePostsQuery });
                    await clearDraft();
                    setOpen(false);
                    setCaption('');
                    setLocation('');
                    setTags(['Blender', 'Unreal Engine 5']);
                    setMediaFiles([]);
                    setHasUploaded(false);
                    linkRef!.current?.click() // Navigate to feed top to show the new post
                },
            }
        
        )

        }catch(error){
            console.log(error)
        }finally{
            setIsSubmitting(false);
        }
    }
  return (
    <Dialog open={open} onOpenChange={setOpen} >
        <DialogTrigger className='bg-[linear-gradient(-45deg,#CDBDFF,#7849FB)]  fixed  size-16 bottom-6 right-6 rounded-full'>
            <FaPlus  className='text-lg text-[#370096] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'/>
        </DialogTrigger>

        <a href='#feed-top' ref={linkRef} className='hidden '></a>
        
        <DialogContent showCloseButton={false} className='max-w-5xl! [&>button]:text-white [&>button]:text-xl [&>button]:opacity-100 p-0! rounded-l-[24px] max-h-[90vh]! h-full w-full backface-visible bg-[#201F21]/80  backdrop-blur-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]'>
            
            {/* Loading Overlay */}
            {isSubmitting && (
                <div className='fixed inset-0  bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-100 rounded-l-[24px]'>
                    <div className='flex flex-col items-center space-y-6'>
                        {/* Spinner Animation */}
                        <div className='relative w-20 h-20'>
                            <div className='absolute inset-0 rounded-full border-4 border-[#BA9EFF]/30'></div>
                            <div className='absolute inset-0 rounded-full border-t-4 border-[#BA9EFF] animate-spin'></div>
                        </div>
                        
                        {/* Loading Text */}
                        <div className='text-center space-y-2'>
                            <p className='text-white font-semibold text-lg'>Creating your masterpiece...</p>
                            <p className='text-[#ADAAAB] text-sm'>Processing and uploading your work</p>
                        </div>
                        
                        {/* Progress dots */}
                        <div className='flex space-x-2 mt-4'>
                            <div className='w-2 h-2 bg-[#BA9EFF] rounded-full animate-bounce' style={{animationDelay: '0s'}}></div>
                            <div className='w-2 h-2 bg-[#BA9EFF] rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
                            <div className='w-2 h-2 bg-[#BA9EFF] rounded-full animate-bounce' style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                </div>
            )}

            <div className='grid grid-cols-12'>
                <div className='col-span-8'>
                    <UploadFile mediaFiles={mediaFiles} setHasUploaded={setHasUploaded} setMediaFiles={setMediaFiles} isSubmitting={isSubmitting}/>
                </div>
                <div className='col-span-4 bg-[#131314] h-full w-full p-6 pb-0 flex max-h-[90vh] flex-col justify-between   '>
                    {
                        hasUploaded ? (
                            <Fragment>
                                <Card className='flex relative flex-col max-h-[90vh] bg-transparent h-full p-1 space-y-4'>
                                    {/* Header Section */}
                                    <CardHeader className='flex p-0 justify-between items-center'>
                                        <h2 className='font-bold text-white text-xl'>New Entry</h2>
                                        <DialogClose className='text-[#767576] hover:text-white transition-colors'>
                                            <MdClose size={24} />
                                        </DialogClose>
                                    </CardHeader>

                                    <CardContent className='flex max-h-[75%] p-0 pb-64  flex-1 flex-col overflow-y-scroll no-scrollbar space-y-6'>
                                        {/* Narrative Section */}
                                        <div className='space-y-2'>
                                            <div className='text-[#BA9EFF] text-xs font-bold uppercase tracking-wider'>Narrative</div>
                                            <Textarea 
                                                value={caption}
                                                onChange={(e) => setCaption(e.target.value)}
                                                className='bg-[#0E0E0F] min-h-32 max-h-40 placeholder:text-[#52525B] text-[#ADAAAB] outline-none border-none rounded-[16px] focus:ring-0 focus:border-none focus-visible:ring-0 focus:outline-none scrollbar-hide resize-none p-4' 
                                                id="textarea-message" 
                                                placeholder="Describe the soul of this piece..." 
                                            />
                                        </div>

                                        {/* Geographic Anchor Section */}
                                        <div className='space-y-6'>
                                            <label className='text-[#767576] text-xs font-bold uppercase tracking-wider'>Geographic Anchor</label>
                                            <div className='relative flex items-center'>
                                                <LuMapPin className='absolute left-4 text-[#BA9EFF]' size={18} />
                                                <Input 
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    type="text" 
                                                    className='bg-[#0E0E0F] pl-12 pr-4 py-6 placeholder:text-[#52525B] text-[#ADAAAB] focus-visible:ring-0 outline-none border-none rounded-[12px] w-full' 
                                                    id="input-location" 
                                                    placeholder="Kyoto, Japan - Digital District" 
                                                />
                                            </div>
                                        </div>

                                        {/* Tools & Software (Tags) Section */}
                                        <div className='space-y-3'>
                                            <label className='text-[#767576] text-xs font-bold uppercase tracking-wider'>Tools & Software</label>
                                            <div className='flex flex-wrap gap-2'>
                                                {tags.map((tag, index) => (
                                                    <div key={index} className='flex items-center space-x-2 bg-[#262627] border border-[#BA9EFF]/20 px-3 py-1.5 rounded-lg text-[#BA9EFF] text-sm'>
                                                        <span>{tag}</span>
                                                        <MdClose className='cursor-pointer' size={14} onClick={() => setTags(tags.filter(t => t !== tag))} />
                                                    </div>
                                                ))}
                                                <button onClick={() => setShowAddTool(!showAddTool)} className='border border-dashed border-[#484849] px-3 py-1.5 rounded-lg text-[#767576] text-sm hover:border-[#BA9EFF] hover:text-[#BA9EFF] transition-all'>
                                                    + Add Tool
                                                </button>
                                                {showAddTool && (
                                                    <div className='flex flex-wrap gap-2 mt-2'>
                                                        {availableTools.filter(tool => !tags.includes(tool)).map((tool, index) => (
                                                            <button key={index} onClick={() => { setTags([...tags, tool]); setShowAddTool(false); }} className='bg-[#262627] border border-[#BA9EFF]/20 px-3 py-1.5 rounded-lg text-[#767576] text-sm hover:border-[#BA9EFF] hover:text-[#BA9EFF] transition-all'>
                                                                {tool}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Toggles Section */}
                                        {/* <div className='space-y-4 pt-4'>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center space-x-3 text-[#ADAAAB]'>
                                                    <LuMessageSquare size={18} className='text-[#767576]' />
                                                    <span className='text-sm font-medium'>Allow Comments</span>
                                                </div>
                                                <Switch className="bg-[#BA9EFF]" defaultChecked />
                                            </div>
                                        </div> */}
                                    </CardContent>

                                    {/* Action Buttons */}
                                    <CardFooter className='flex w-full space-x-4 p-0 pb-2 absolute bottom-0 right-0  bg-[#131314]  border-none'>
                                        <Button onClick={saveDraft} disabled={isSubmitting} className='flex-1 bg-[#262627] hover:bg-[#323233] text-[#767576] font-bold py-6 rounded-xl uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
                                            {isSubmitting ? 'Saving...' : 'Save Draft'}
                                        </Button>
                                        <Button onClick={handleCreatePost} disabled={isSubmitting || !caption} className='flex-1 tracking-wide bg-[linear-gradient(90deg,#BA9EFF,#8455EF)]  rounded-[12px] border-none py-6! text-xs text-[#2B006E] disabled:opacity-50 disabled:cursor-not-allowed'>
                                            {isSubmitting ? 'Publishing...' : 'Publish'} 
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Fragment>
                        ) :(
                            <Fragment>
                                <div className='flex flex-col space-y-8'>
                                    <div className='bg-linear-to-r from-[#BA9EFF] to-[#BA9EFF]/5 w-12 h-1 rounded-lg'></div>
                                    <h2 className='font-bold text-[#767576] uppercase text-xl'>Details</h2>
                                    <div className='flex flex-col space-y-8 '>
                                        <div className='space-y-3 relative'>
                                        
                                            <div className='bg-[#484849] w-20 h-4 rounded-lg skeleton-shimmer'></div>
                                            <div className='bg-[#262627] skeleton-shimmer border border-[#484849]/20 w-full h-12 rounded-[8px]'></div>
                                        </div>
                                        <div className='space-y-3'>
                                            <div className='bg-[#484849] skeleton-shimmer w-26 h-4 rounded-lg'></div>
                                            <div className='bg-[#262627] skeleton-shimmer border border-[#484849]/20 w-full h-26 rounded-[8px]'></div>
                                        </div>
                                        <div className='space-y-3'>
                                            <div className='bg-[#484849] skeleton-shimmer w-16 h-4 rounded-lg'></div>
                                            <div className='flex space-x-2'>
                                            <div className='bg-[#262627] skeleton-shimmer border border-[#484849]/20 w-16 h-8 rounded-full'></div>
                                            <div className='bg-[#262627] skeleton-shimmer border border-[#484849]/20 w-20 h-8 rounded-full'></div>
            
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className='text-[#767576] max-w-60 pb-6 mx-auto text-xs text-center'>Metadata and captioning will be available once media is selected.</p>
                            </Fragment>
                        )
                    }
                </div>
            </div>
        </DialogContent>
    </Dialog>
  )
}

export default CreatePostDialog