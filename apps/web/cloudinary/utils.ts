import axios from "axios";
import { CloudinaryResource } from "./types";
import { MediaFile } from "@/components/dashboard/feeds/CreatePostDialog";
import { PostMedia, postMedia } from "@repo/trpc/post";

export interface CloudinaryUploadResponse extends CloudinaryResource {
    cropWidth?:number
    cropHeight?:number
    x?:number
    y?:number
    aspect?:number
}


export const  uploadFilesToCloudinary =  (mediaFiles:MediaFile[]) :Promise<CloudinaryUploadResponse[]> | null => {
    const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const unsigned_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;
    const folder_name = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER_NAME;
    const uploadMediaPromises = mediaFiles.map(async (mediaFile) => {

        const formData = new FormData();
        formData.append('file', mediaFile.file)
        formData.append("upload_preset",unsigned_preset!);
        formData.append("api_key", api_key!);
        formData.append('folder',folder_name!)

        console.log(mediaFile,'this is the media file')
        const {data} = await axios.post<CloudinaryResource>(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,formData)
        return {
            ...data,
            x:mediaFile.x,
            y:mediaFile.y,
            aspect:mediaFile.aspect,
            cropHeight: mediaFile.height,
            cropWidth:mediaFile.width,


        }
    })

    try{
        return Promise.all(uploadMediaPromises)
    }catch(err){
        console.error("One or more uploads failed:", err);
        return null;
    }

}

export async function uploadToCloudinary(file: File) {
    const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const unsigned_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;
    const folder_name = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER_NAME;
    const formData = new FormData()

    formData.append('file',file)
    formData.append("upload_preset",unsigned_preset!);
    formData.append("api_key", api_key!);
    formData.append('folder',folder_name!)

    const {data} = await axios.post(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,formData)


    return data.secure_url as string
  }



export const getImageUrl = (media: PostMedia ) => {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const base  = `https://res.cloudinary.com/${cloud}/image/upload`

  // If no crop data saved yet, just serve the image as-is
  if (!media.x && !media.y && !media.cropWidth && !media.cropHeight) {
    return `${base}/c_fill,w_800,q_auto,f_auto/v${media.version}/${media.publicId}.${media.format}`
  }

  return (
    `${base}/` +
    // Step 1: crop to the exact region the user selected
    `c_crop,g_north_west,x_${Math.round(media.x!)},y_${Math.round(media.y!)},w_${Math.round(media.cropWidth!)},h_${Math.round(media.cropHeight!)}/` +
    // Step 2: resize the cropped result for delivery
    `c_fill,w_800,q_auto,f_auto/` +
    `v${media.version}/${media.publicId}.${media.format}`
  )
}


export const getImageUrlFromCloudinary = (
  response: CloudinaryUploadResponse
) => {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const base = `https://res.cloudinary.com/${cloud}/image/upload`;

  // Define defaults or handle missing crop data for raw responses
  // (raw responses might not have 'x', 'y' properties unless they were uploaded with cropping parameters)
  console.log(response,'this is the response')
  if (!response.x && !response.y) {
    return `${base}/c_fill,w_800,q_auto,f_auto/v${response.version}/${response.public_id}.${response.format}`;
  }

  return (
    `${base}/` +
    `c_crop,g_north_west,x_${Math.round(response.x!)},y_${Math.round(
      response.y!
    )},w_${Math.round(response.cropWidth!)},h_${Math.round(
      response.cropHeight!
    )}/` +
    `c_fill,w_800,q_auto,f_auto/` +
    `v${response.version}/${response.public_id}.${response.format}`
  );
};
// "https://res.cloudinary.com/dw9vmzsd4/image/upload/v1774926041/pixora/kajavrrwvsoxmah7k00p.jpg",
// "url": "https://res.cloudinary.com/dw9vmzsd4/image/upload/v1775827204/pixora/euuzebst4xvcvdawj9ej.png",