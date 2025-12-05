
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, PlusSquare, Clipboard } from "lucide-react";
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
  thumbnailUrl: z.string().url("Please enter a valid thumbnail URL."),
});

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
      thumbnailUrl: "",
    },
  });
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      form.setValue('thumbnailUrl', text, { shouldValidate: true });
      toast({
        title: "Pasted from clipboard!",
      });
    } catch (error) {
      toast({
        title: "Failed to paste",
        description: "Could not read from clipboard. Please check browser permissions.",
        variant: "destructive"
      })
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    const videosCollection = collection(firestore, 'videos');

    try {
        const newVideo = {
            title: values.title,
            description: values.description,
            videoUrl: values.videoUrl,
            thumbnailUrl: values.thumbnailUrl,
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
            description: "There was an error submitting your video. Please try again.",
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
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input placeholder="https://your-drive-link/image.jpg" {...field} className="pr-10"/>
                    </FormControl>
                    <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={handlePaste} aria-label="Paste from clipboard">
                        <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
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

    