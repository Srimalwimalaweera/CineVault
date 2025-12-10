
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '@/hooks/use-auth';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, ArrowLeft, PlusCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from "@/components/ui/progress";

const TOTAL_PAYMENT_AMOUNT = 950;

type ServiceProvider = {
  name: string;
  status: 'allow' | 'deny';
  amounts: number[];
};

type Settings = {
  providers: ServiceProvider[];
};

type CardInput = {
  id: number;
  provider: string;
  amount: string;
  pin: string;
};

export default function SamplePage() {
  const { user, isUserLoading } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardInputs, setCardInputs] = useState<CardInput[]>([{ id: 1, provider: '', amount: '', pin: '' }]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'serviceProviders');
  }, [firestore]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<Settings>(settingsRef);
  
  const allowedProviders = useMemo(() => {
    return settings?.providers.filter(p => p.status === 'allow') || [];
  }, [settings]);

  const totalEnteredAmount = useMemo(() => {
    return cardInputs.reduce((acc, card) => acc + (Number(card.amount) || 0), 0);
  }, [cardInputs]);
  
  const remainingAmount = TOTAL_PAYMENT_AMOUNT - totalEnteredAmount;
  const isPaymentComplete = totalEnteredAmount >= TOTAL_PAYMENT_AMOUNT;

  useEffect(() => {
    // Automatically add a new card input if the last one is filled and payment is not complete
    if (cardInputs.length > 0 && !isPaymentComplete) {
      const lastCard = cardInputs[cardInputs.length - 1];
      if (lastCard.provider && lastCard.amount && lastCard.pin) {
        setCardInputs(prev => [...prev, { id: Date.now(), provider: '', amount: '', pin: '' }]);
      }
    }
  }, [cardInputs, isPaymentComplete]);

  const handleCardChange = (id: number, field: keyof Omit<CardInput, 'id'>, value: string) => {
    setCardInputs(prev =>
      prev.map(card => (card.id === id ? { ...card, [field]: value } : card))
    );
  };
  
  const removeCardInput = (id: number) => {
    if (cardInputs.length > 1) {
      setCardInputs(prev => prev.filter(card => card.id !== id));
    }
  };

  const getProviderAmounts = (providerName: string): number[] => {
    const provider = allowedProviders.find(p => p.name === providerName);
    return provider?.amounts || [];
  };

  const handleSubmit = async () => {
    if (!user || !firestore || !isPaymentComplete) {
      toast({
        title: 'Incomplete Payment',
        description: `Please add cards to meet the total of LKR ${TOTAL_PAYMENT_AMOUNT}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentData = {
        userId: user.uid,
        totalAmount: totalEnteredAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
        cards: cardInputs
          .filter(c => c.provider && c.amount && c.pin) // Only submit filled cards
          .map(({ provider, amount, pin }) => ({ provider, amount: Number(amount), pin })),
      };

      await addDocumentNonBlocking(collection(firestore, 'payments'), paymentData);

      toast({
        title: 'Payment Submitted',
        description: 'Your payment is being processed. You will be notified shortly.',
      });
      // Optionally reset form or redirect user
      setCardInputs([{ id: 1, provider: '', amount: '', pin: '' }]);

    } catch (error) {
      console.error('Payment submission failed', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoadingSettings || isUserLoading) {
      return <Skeleton className="h-64 w-full" />;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>One-Time Pro Plan Payment</CardTitle>
          <CardDescription>
            Use mobile recharge cards to pay the total amount of 
            <span className="font-bold text-foreground"> LKR {TOTAL_PAYMENT_AMOUNT.toFixed(2)}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className='flex justify-between items-center text-sm'>
              <span className='font-medium'>Amount Paid: LKR {totalEnteredAmount.toFixed(2)}</span>
              <span className='text-muted-foreground'>Remaining: LKR {(remainingAmount > 0 ? remainingAmount : 0).toFixed(2)}</span>
            </div>
            <Progress value={(totalEnteredAmount / TOTAL_PAYMENT_AMOUNT) * 100} />
          </div>
          <div className="space-y-4">
            {cardInputs.map((card, index) => (
              <div key={card.id} className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,2fr,auto] gap-2 items-end p-3 border rounded-lg bg-background">
                <div className='flex flex-col gap-1.5'>
                  {index === 0 && <Label className='text-xs text-muted-foreground'>Provider</Label>}
                  <Select
                    value={card.provider}
                    onValueChange={(value) => handleCardChange(card.id, 'provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedProviders.map(p => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex flex-col gap-1.5'>
                  {index === 0 && <Label className='text-xs text-muted-foreground'>Amount</Label>}
                   <Select
                    value={card.amount}
                    onValueChange={(value) => handleCardChange(card.id, 'amount', value)}
                    disabled={!card.provider}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="LKR" />
                    </SelectTrigger>
                    <SelectContent>
                      {getProviderAmounts(card.provider).map(amount => (
                          <SelectItem key={amount} value={String(amount)}>LKR {amount}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className='flex flex-col gap-1.5'>
                  {index === 0 && <Label className='text-xs text-muted-foreground'>Scratch Card PIN</Label>}
                  <Input
                    placeholder="Enter PIN"
                    value={card.pin}
                    onChange={(e) => handleCardChange(card.id, 'pin', e.target.value)}
                  />
                </div>
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeCardInput(card.id)} 
                    disabled={cardInputs.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove card"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
           { !isPaymentComplete && (
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => setCardInputs(prev => [...prev, { id: Date.now(), provider: '', amount: '', pin: '' }])}
              >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Another Card
              </Button>
            </div>
           )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button 
            className="w-full"
            onClick={handleSubmit} 
            disabled={!isPaymentComplete || isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              `Submit Payment (LKR ${totalEnteredAmount.toFixed(2)})`
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            By clicking "Submit", you agree to our terms of service. The Pro plan will be activated upon successful validation of the recharge cards.
          </p>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container max-w-2xl py-12">
          <div className="mb-8 flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/pro">
                <ArrowLeft />
                <span className="sr-only">Back to Pro Page</span>
              </Link>
            </Button>
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
              <CreditCard/> Secure Payment
            </h1>
          </div>
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
