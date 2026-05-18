'use client'

import React from 'react'
import Image from 'next/image'
import Cropper from 'react-easy-crop'

import { UserProfile } from '@repo/trpc/user'

import { Button } from '../ui/button'

import { useTRPC } from '@/utils/trpc'

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { uploadToCloudinary } from '@/cloudinary/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile
}

export function EditProfileDialog({
  open,
  onOpenChange,
  user,
}: Props) {
  const trpc = useTRPC()

  const queryClient = useQueryClient()

  const editProfileMutation = useMutation(
    trpc.user.editProfile.mutationOptions()
  )

  const userProfileKey =
    trpc.user.getUserById.queryKey()

  // form state
  const [name, setName] = React.useState(
    user.name
  )

  const [bio, setBio] = React.useState(
    user.bio || ''
  )

  const [location, setLocation] =
    React.useState(
      user.location || ''
    )

  // image state
  const [previewImage, setPreviewImage] =
    React.useState(user.image || '')

  const [imageFile, setImageFile] =
    React.useState<File | null>(null)

  // crop state
  const [showCropper, setShowCropper] =
    React.useState(false)

  const [crop, setCrop] =
    React.useState({
      x: 0,
      y: 0,
    })

  const [zoom, setZoom] =
    React.useState(1)

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = React.useState<any>(null)

  // sync form when user changes
  React.useEffect(() => {
    setName(user.name)
    setBio(user.bio || '')
    setLocation(user.location || '')
    setPreviewImage(user.image || '')
    setImageFile(null)
  }, [user])

  function handleAvatarChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]

    if (!file) return

    const previewUrl =
      URL.createObjectURL(file)

    setPreviewImage(previewUrl)

    setImageFile(file)

    setShowCropper(true)
  }

  async function getCroppedImg(
    imageSrc: string,
    pixelCrop: any
  ) {
    const image =
      document.createElement('img')

    image.src = imageSrc

    await new Promise((resolve) => {
      image.onload = resolve
    })

    const canvas =
      document.createElement('canvas')

    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob)
          },
          'image/jpeg',
          1
        )
      }
    )
  }

  async function handleCropSave() {
    if (
      !previewImage ||
      !croppedAreaPixels
    )
      return

    const croppedBlob =
      await getCroppedImg(
        previewImage,
        croppedAreaPixels
      )

    if (!croppedBlob) return

    const croppedFile = new File(
      [croppedBlob],
      'avatar.jpg',
      {
        type: 'image/jpeg',
      }
    )

    setImageFile(croppedFile)

    const croppedPreview =
      URL.createObjectURL(
        croppedBlob
      )

    setPreviewImage(croppedPreview)

    setShowCropper(false)
  }

  async function handleSave() {
    try {
      const updates: Record<
        string,
        unknown
      > = {}

      // changed fields only
      if (name !== user.name) {
        updates.name = name
      }

      if (
        bio !== (user.bio || '')
      ) {
        updates.bio = bio
      }

      if (
        location !==
        (user.location || '')
      ) {
        updates.location = location
      }

      // upload image if changed
      if (imageFile) {
        const uploadedImage =
          await uploadToCloudinary(
            imageFile
          )

        updates.image =
          uploadedImage
      }

      // no changes
      if (
        Object.keys(updates)
          .length === 0
      ) {
        onOpenChange(false)
        return
      }

      await editProfileMutation.mutateAsync(
        updates
      )

      await queryClient.invalidateQueries(
        {
          queryKey:
            userProfileKey,
        }
      )

      onOpenChange(false)
    } catch (error) {
      console.error(error)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-[#0A0A0C] border border-white/10 p-6 space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Edit Profile
          </h2>

          <p className="mt-1 text-sm text-[#918FA0]">
            Update your public
            profile
          </p>
        </div>

        {/* Cropper */}
        {showCropper && (
          <div className="space-y-4">

            <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black">
              <Cropper
                image={previewImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={
                  setCrop
                }
                onZoomChange={
                  setZoom
                }
                onCropComplete={(
                  _,
                  croppedPixels
                ) => {
                  setCroppedAreaPixels(
                    croppedPixels
                  )
                }}
              />
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) =>
                setZoom(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full"
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setShowCropper(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                onClick={
                  handleCropSave
                }
              >
                Apply Crop
              </Button>
            </div>
          </div>
        )}

        {/* Avatar */}
        {!showCropper && (
          <div className="flex items-center gap-5">

            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#1a1a1d]">
              {previewImage ? (
                <Image
                  src={
                    previewImage
                  }
                  alt="avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No image
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={
                  handleAvatarChange
                }
                className="text-sm text-white"
              />

              <p className="text-xs text-[#918FA0]">
                JPG, PNG up to
                5MB
              </p>
            </div>
          </div>
        )}

        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm text-[#C7C4D7]">
            Name
          </label>

          <input
            value={name? name : ""}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            placeholder="Your name"
            className="w-full rounded-lg border border-transparent bg-[#1a1a1d] p-3 text-white outline-none focus:border-[#7849FB]"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm text-[#C7C4D7]">
            Location
          </label>

          <input
            value={location}
            onChange={(e) =>
              setLocation(
                e.target.value
              )
            }
            placeholder="Lagos, Nigeria"
            className="w-full rounded-lg border border-transparent bg-[#1a1a1d] p-3 text-white outline-none focus:border-[#7849FB]"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm text-[#C7C4D7]">
            Bio
          </label>

          <textarea
            value={bio}
            onChange={(e) =>
              setBio(
                e.target.value
              )
            }
            placeholder="Tell people about yourself..."
            className="h-28 w-full resize-none rounded-lg border border-transparent bg-[#1a1a1d] p-3 text-white outline-none focus:border-[#7849FB]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">

          <Button
            variant="secondary"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={
              editProfileMutation.isPending
            }
            className="bg-[linear-gradient(19deg,#CDBDFF,#7849FB)] text-[#370096]"
          >
            {editProfileMutation.isPending
              ? 'Saving...'
              : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}