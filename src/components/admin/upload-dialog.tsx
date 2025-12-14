
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, PlusSquare, Clipboard, FileImage, Loader2 } from "lucide-react";
import { useFirestore, useStorage } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDocumentNonBlocking } from "@/firebase";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNotification } from "@/hooks/use-notification";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  videoUrl: z.string().url("Please enter a valid URL."),
  thumbnailUrl: z.string().url("Please provide a thumbnail URL or upload an image."),
  accessLevel: z.enum(["free", "pro"]),
});

export function AdminUploadDialog() {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const storage = useStorage();
  const { showNotification } = useNotification();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      accessLevel: "free",
    },
  });
  
  const handlePaste = async (fieldName: "videoUrl" | "thumbnailUrl") => {
    try {
      const text = await navigator.clipboard.readText();
      form.setValue(fieldName, text, { shouldValidate: true });
    } catch (error) {
      console.error("Failed to paste", error);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !storage) return;

    const storageRef = ref(storage, `thumbnails/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploadProgress(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          form.setValue('thumbnailUrl', downloadURL, { shouldValidate: true });
          setUploadProgress(null);
        });
      }
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    const videosCollection = collection(firestore, 'videos');

    try {
        const newVideo = {
            ...values,
            ratings: 0,
            reactionCount: 0,
            downloadCount: 0,
            viewCount: 0,
            createdAt: serverTimestamp(),
            status: 'published',
        };
        
        addDocumentNonBlocking(videosCollection, newVideo);
        showNotification("Video Uploaded");
        
        form.reset();
        setOpen(false);

    } catch (error) {
         console.error("Upload Failed", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden md:inline-flex">
          <UploadCloud className="mr-2 h-4 w-4" />
          Admin Upload
        </Button>
      </DialogTrigger>
      <DialogTrigger asChild>
        <Button size="icon" className="md:hidden h-16 w-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusSquare className="h-8 w-8" />
            <span className="sr-only">Upload Video</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Upload Video</DialogTitle>
          <DialogDescription>
            Add a new video to the CineVault platform. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Echoes of Nebula" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief synopsis of the video..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Input placeholder="https://example.com/video.mp4" {...field} className="pr-10"/>
                    </FormControl>
                    <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={() => handlePaste('videoUrl')} aria-label="Paste from clipboard">
                        <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input placeholder="Paste URL or upload an image" {...field} className="pr-10"/>
                    </FormControl>
                    <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={() => handlePaste('thumbnailUrl')} aria-label="Paste from clipboard">
                        <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Or Upload Thumbnail</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    id="thumbnail-upload" 
                    type="file" 
                    className="pr-10" 
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleFileChange}
                    disabled={uploadProgress !== null}
                  />
                </FormControl>
                <div className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 flex items-center justify-center">
                  {uploadProgress !== null ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileImage className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              {uploadProgress !== null && (
                <Progress value={uploadProgress} className="w-full mt-2 h-2" />
              )}
            </FormItem>

            <FormField
              control={form.control}
              name="accessLevel"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Access Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="free" id="r1" />
                        </FormControl>
                        <FormLabel htmlFor="r1" className="font-normal">Free</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="pro" id="r2" />
                        </FormControl>
                        <FormLabel htmlFor="r2" className="font-normal">Pro</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting || uploadProgress !== null}>
                {form.formState.isSubmitting ? 'Uploading...' : 'Upload Video'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
