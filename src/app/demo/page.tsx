'use client';

import { UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Container } from '@/components/layout/container';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { StatCard } from '@/components/shared/stat-card';
import { Stepper } from '@/components/shared/stepper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const steps = [
  { id: 'amount', label: 'Amount' },
  { id: 'signin', label: 'Sign in' },
  { id: 'payment', label: 'Payment' },
];

export default function DemoPage() {
  return (
    <Container className="space-y-12 py-12">
      <h1>Component demo (temporary)</h1>

      <section aria-labelledby="d-stats" className="space-y-4">
        <h2 id="d-stats">Stats and progress</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard value="1,240" label="Alumni registered" icon={UsersIcon} sample />
          <StatCard value="NPR 4.2M" label="Funds raised" sample />
          <StatCard value="6" label="Active programmes" sample />
        </div>
        <ProgressBar
          label="Scholarship Fund"
          raised={420000}
          target={1000000}
          raisedLabel="NPR 4,200"
          targetLabel="NPR 10,000"
          supporters={58}
        />
        <Stepper steps={steps} currentIndex={1} />
      </section>

      <section aria-labelledby="d-states" className="space-y-4">
        <h2 id="d-states">States</h2>
        <EmptyState
          title="No alumni match these filters"
          description="Try removing a filter or searching for a different name."
          action={<Button variant="outline">Reset filters</Button>}
        />
        <ErrorState onRetry={() => toast.success('Retry clicked')} />
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>

      <section aria-labelledby="d-surfaces" className="space-y-4">
        <h2 id="d-surfaces">Surfaces</h2>
        <Card>
          <CardHeader>
            <CardTitle>Sample card</CardTitle>
            <CardDescription>Cards hold goals, events, people and posts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>Approved</Badge>
            <Badge variant="secondary">MBBS</Badge>
            <Badge variant="outline">Sample</Badge>
          </CardContent>
        </Card>
        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">Current board</TabsTrigger>
            <TabsTrigger value="previous">Previous boards</TabsTrigger>
          </TabsList>
          <TabsContent value="current">Current board members appear here.</TabsContent>
          <TabsContent value="previous">Past boards, grouped by term.</TabsContent>
        </Tabs>
        <Accordion>
          <AccordionItem value="a">
            <AccordionTrigger>How do we work with BPKIHS?</AccordionTrigger>
            <AccordionContent>Sample answer text for the accordion.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Where does my donation go?</AccordionTrigger>
            <AccordionContent>Sample answer text for the second item.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section aria-labelledby="d-nav" className="space-y-4">
        <h2 id="d-nav">Navigation and overlays</h2>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Demo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger>Open dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sample dialog</DialogTitle>
                <DialogDescription>Focus is trapped here. Press Escape to close.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger>Open sheet</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sample sheet</SheetTitle>
                <SheetDescription>Used for the mobile menu and filters.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Button onClick={() => toast.success('Saved. This is a sample toast.')}>
            Show toast
          </Button>
        </div>
      </section>

      <Toaster />
    </Container>
  );
}
