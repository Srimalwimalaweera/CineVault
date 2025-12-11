
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, ArrowLeft, Check, X, User, Calendar, CircleDollarSign } from 'lucide-react';
import type { Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '@/hooks/use-notification';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

function PaymentCard({ payment }: { payment: Payment }) {
    const firestore = useFirestore();
    const { showNotification } = useNotification();

    const handleApprove = () => {
        if (!firestore) return;
        const paymentRef = doc(firestore, 'payments', payment.id);
        const userRef = doc(firestore, 'users', payment.userId);
        
        updateDocumentNonBlocking(paymentRef, { status: 'completed', updatedAt: serverTimestamp() });
        updateDocumentNonBlocking(userRef, { role: 'pro', proActivationDate: serverTimestamp() });

        showNotification(`Payment from ${payment.user?.displayName} approved.`);
    };

    const handleReject = () => {
        if (!firestore) return;
        const paymentRef = doc(firestore, 'payments', payment.id);
        const userRef = doc(firestore, 'users', payment.userId);

        updateDocumentNonBlocking(paymentRef, { status: 'failed', updatedAt: serverTimestamp() });
        updateDocumentNonBlocking(userRef, { rejectedPayments: arrayUnion(serverTimestamp()) });
        
        showNotification(`Payment from ${payment.user?.displayName} rejected.`);
    };

    const submittedAt = payment.createdAt ? formatDistanceToNow(payment.createdAt.toDate(), { addSuffix: true }) : 'unknown';

    return (
        <Card>
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className='h-5 w-5' /> {payment.user?.displayName}
                        </CardTitle>
                        <CardDescription>{payment.user?.email}</CardDescription>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                </div>
                 <div className='flex items-center gap-4 text-sm text-muted-foreground pt-2'>
                    <div className='flex items-center gap-1.5'>
                        <CircleDollarSign className='h-4 w-4' />
                        LKR {payment.totalAmount.toFixed(2)}
                    </div>
                     <div className='flex items-center gap-1.5'>
                        <Calendar className='h-4 w-4' />
                        {submittedAt}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger>View {payment.cards.length} Scratch Cards</AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-2">
                                {payment.cards.map((card, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                        <div className='font-mono text-sm'>
                                            <span className='font-semibold'>{card.provider}</span>
                                            <span className='text-muted-foreground'> / </span>
                                            <span className='text-muted-foreground'>LKR {card.amount}</span>
                                        </div>
                                        <div className="font-mono text-foreground bg-background p-1 rounded">
                                            {card.pin}
                                        </div>
                                    </div>
                                ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={handleReject}>
                    <X className="mr-2 h-4 w-4" />
                    Reject
                </Button>
                 <Button variant="default" className='bg-green-600 hover:bg-green-700' onClick={handleApprove}>
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function AdminPaymentsPage() {
  const { isUserLoading, isAdmin } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/profile');
    }
  }, [isUserLoading, isAdmin, router]);

  const pendingPaymentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(
        collection(firestore, 'payments'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc')
    );
  }, [firestore, isAdmin]);

  const { data: pendingPayments, isLoading } = useCollection<Payment>(pendingPaymentsQuery);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      );
    }
    
    if (pendingPayments && pendingPayments.length > 0) {
      return (
        <div className="flex flex-col gap-4">
          {pendingPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      );
    }

    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>No Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">All payments have been processed. Great work!</p>
        </CardContent>
      </Card>
    );
  }

  if (isUserLoading || !isAdmin) {
    return (
         <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-muted/20 flex items-center justify-center">
                <div className="container max-w-md text-center">
                    <p>Loading...</p>
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container max-w-2xl py-12">
          <div className="mb-8 flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeft />
                <span className="sr-only">Back to Profile</span>
              </Link>
            </Button>
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><ShieldCheck/> Payment Approvals</h1>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

    