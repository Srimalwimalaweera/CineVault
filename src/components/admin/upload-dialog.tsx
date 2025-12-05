"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, PlusSquare } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
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

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  videoUrl: z.string().url("Please enter a valid URL."),
  thumbnail: z.custom<FileList>().refine((files) => files?.length > 0, 'Thumbnail is required.'),
});

// This is a placeholder. In a real app, you would upload the file to a service like Firebase Storage
// and get a URL back.
async function uploadFile(file: File): Promise<string> {
  console.log(`Simulating upload for ${file.name}`);
  return new Promise(resolve => {
    setTimeout(() => {
      // Create a blob URL to simulate an uploaded file URL
      const blobUrl = URL.createObjectURL(file);
      console.log(`Generated blob URL: ${blobUrl}`);
      resolve(blobUrl);
    }, 1000);
  });
}

export function AdminUploadDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
    },
  });
  
  const thumbnailRef = form.register("thumbnail");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    const videosCollection = collection(firestore, 'videos');

    try {
        const thumbnailUrl = await uploadFile(values.thumbnail[0]);

        const newVideo = {
            title: values.title,
            description: values.description,
            videoUrl: values.videoUrl,
            thumbnailUrl: thumbnailUrl,
            ratings: Math.round((Math.random() * (5 - 3) + 3) * 10) / 10,
            reactionCount: Math.floor(Math.random() * 5000),
            downloadCount: Math.floor(Math.random() * 10000),
            viewCount: Math.floor(Math.random() * 200000),
        };
        
        addDocumentNonBlocking(videosCollection, newVideo);

        toast({
            title: "Video Submitted",
            description: `"${values.title}" has been added to the database.`,
        });
        
        form.reset();
        setOpen(false);

    } catch (error) {
         toast({
            title: "Upload Failed",
            description: "There was an error uploading your video. Please try again.",
            variant: "destructive"
        });
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
                  <FormControl>
                    <Input placeholder="https://example.com/video.mp4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="thumbnail"
              render={() => (
                <FormItem>
                  <FormLabel>Thumbnail</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" {...thumbnailRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Uploading...' : 'Upload Video'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
