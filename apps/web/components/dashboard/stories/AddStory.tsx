import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  Bell,
  Mail,
  Type,
  Sparkles,
  Music2,
  Sticker,
  Crop,
  UploadCloud,
  X,
  Home,
  Compass,
  MessageSquare,
  PlusSquare,
  LucideIcon,
} from "lucide-react";

import { ReactNode, useState } from "react";
import { MediaFile } from "../feeds/CreatePostDialog";
import UploadStory from "./UploadStory";
import { cn } from "@/lib/utils";
import { del, set } from "idb-keyval";
import {  getImageUrl, getImageUrlFromCloudinary, uploadFilesToCloudinary } from "@/cloudinary/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Mediatype } from "../../../../backend/generated/prisma/enums";

interface AddStoryProp {
  openAddDialog: boolean;
  setOpenAddDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AddStory({openAddDialog,setOpenAddDialog}:AddStoryProp) {
  const queryClient = useQueryClient();
  const trpc = useTRPC()
  const addStory = useMutation(trpc.user.addStory.mutationOptions())
  const storiesQueryKey = trpc.user.getStories.queryKey()
  
  const [mediaFiles,setMediaFiles] = useState<MediaFile[]>([])
  const [hasUploaded,setHasUploaded] = useState(false)
  const [isSubmitting,setIsSubmitting] = useState(false)

  const saveDraft = async() => {
          // const draft = {
          //     caption,
          //     location,
          //     tags,
          //     timestamp: new Date().toISOString(),
          // };
          // localStorage.setItem('pixora-story-draft', JSON.stringify(draft));
          await set('story-draft-files', mediaFiles);
          alert('Draft saved successfully!');
  };

  const clearDraft = async() => {
      // localStorage.removeItem('pixora-draft');
      await del('post-draft-files');
  };

  const handleCreatePost = async()=>{
          try{
              setIsSubmitting(true);
              //first upload the images and get a return value
              const uploadedMediaResponse = await uploadFilesToCloudinary(mediaFiles);
              
  
              if(!uploadedMediaResponse){
                  throw new Error("Media upload failed. Please try again.")
              }
              console.log(uploadedMediaResponse,'this is the upload resp')
              addStory.mutateAsync({
                  medias: uploadedMediaResponse?.map(media=>({
                      url:getImageUrlFromCloudinary(media),
                      type:media.resource_type as Mediatype,
                      duration:media.duration,
                      caption:media.caption,
  
  
                  })) || [],
              },
              {
                  onSuccess:async()=>{
                      queryClient.invalidateQueries({ queryKey: storiesQueryKey });
                      await clearDraft();
                      setMediaFiles([]);
                      setHasUploaded(false);
                       // Navigate to feed top to show the new post
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
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent showCloseButton={false} className='max-w-5xl! [&>button]:text-white [&>button]:text-xl [&>button]:opacity-100 p-0! rounded-l-[24px] max-h-[90vh]! h-full w-full backface-visible bg-[#201F21]/80  backdrop-blur-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]'>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full h-full aspect-9/16 rounded-3xl overflow-hidden flex"
          >
            {/* Loading Overlay */}
            

            {/* LEFT: UPLOAD AREA */}
            <div className="flex-1 bg-[#000000]/50 h-full flex items-center justify-center relative">

              
                <UploadStory mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} setHasUploaded={setHasUploaded} isSubmitting={false}/>

            </div>

            {/* RIGHT: TOOLS */}
            <div className="w-80  p-6 flex flex-col gap-6">

              <h3 className="text-sm uppercase font-semibold tracking-widest text-muted-foreground">
                Editing Tools
              </h3>
              <div className='flex flex-col gap-3 mt-auto'>

                <ToolButton Icon={Type} label="Text" iconClassName='text-[#BA9EFF]' />
                <ToolButton Icon={Sparkles} label="Filters" iconClassName='text-[#53DDFC]' />
                <ToolButton Icon={Music2} label="Music" iconClassName='text-[#9492FF]' />
                <ToolButton Icon={Sticker} label="Stickers" iconClassName='text-[#8455EF]' />
                <ToolButton Icon={Crop} label="Crop" iconClassName='text-[#ADAAAB]' />
              </div>


              <Separator />

              <div className=" space-y-1">
                <div className='flex justify-between gap-1'>

                  <Button onClick={saveDraft} disabled={isSubmitting || !mediaFiles} className='flex-1 bg-[#262627] hover:bg-[#323233] text-[#767576] font-bold py-6 rounded-xl uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
                      {isSubmitting ? 'Saving...' : 'Save Draft'}
                  </Button>

                  <Button onClick={handleCreatePost} disabled={isSubmitting || !mediaFiles} className='flex-1 tracking-wide bg-[linear-gradient(90deg,#BA9EFF,#8455EF)]  rounded-[12px] border-none py-6! text-xs text-[#2B006E] disabled:opacity-50 disabled:cursor-not-allowed'>
                      {isSubmitting ? 'Posting...' : 'Post Story'} 
                  </Button>
                </div>


                <Button
                  variant="ghost"
                  className="w-full bg-red-500 font-bold py-6 text-white"
                  onClick={() => {
                    setMediaFiles([])
                    setOpenAddDialog(false)
                  }}
                >
                  <X className="w-4 h-4 " />
                  Discard
                </Button>
              </div>
            </div>

          </motion.div>

        </DialogContent>
      </Dialog>
  );
}

/* TOOL BUTTON */
function ToolButton({ Icon,iconClassName, label }:{Icon:LucideIcon,label:string,iconClassName:string}) {
  return (
    <div className="flex bg-[#1A191B] font-medium items-center gap-3 p-4 cursor-pointer rounded-lg border border-white/5  hover:bg-muted  transition">
      <Icon className={cn(iconClassName)}/>
      <span className="text-sm hover:text-[#101011] text-white">{label}</span>
    </div>
  );
}