import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Calculator, LineChart, Zap, Sun, DollarSign, Percent, Clock,
  CreditCard, Lightbulb, TrendingUp, PiggyBank, Wallet, Info
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const formSchema = z.object({
  systemCost: z.coerce.number().min(1000, "System cost must be at least $1,000"),
  dealerFee: z.coerce.number().min(0, "Dealer fee cannot be negative").max(100, "Dealer fee cannot exceed 100%"),
  annualRate: z.coerce.number().min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100%"),
  termMonths: z.coerce.number().min(12, "Term must be at least 12 months").max(360, "Term cannot exceed 360 months"),
  monthlyBill: z.coerce.number().min(0, "Bill cannot be negative"),
});

type FormValues = z.infer<typeof formSchema>;

const calculateMonthlyPayment = (principal: number, annualRate: number, termMonths: number) => {
  const monthlyRate = (annualRate / 100) / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
};

const calculateYearlyProjections = (
  monthlyPayment: number,
  monthlyBill: number,
  termMonths: number
) => {
  const years = 25;
  const annualInflation = 0.03; // 3% annual electricity cost increase
  
  return Array.from({ length: years }, (_, i) => {
    const year = i + 1;
    const withoutSolar = monthlyBill * 12 * Math.pow(1 + annualInflation, i);
    const withSolar = year <= termMonths / 12 ? monthlyPayment * 12 : 0;
    
    return {
      year,
      withoutSolar,
      withSolar,
    };
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function App() {
  const [results, setResults] = useState<{
    monthlyPayment: number;
    totalLoanAmount: number;
    actualDealerFee: number;
    totalCost: number;
    yearlyProjections: Array<{
      year: number;
      withoutSolar: number;
      withSolar: number;
    }>;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemCost: undefined,
      dealerFee: undefined,
      annualRate: undefined,
      termMonths: undefined,
      monthlyBill: undefined,
    },
  });

  const onSubmit = (values: FormValues) => {
    const totalLoanAmount = values.systemCost / (1 - values.dealerFee / 100);
    const actualDealerFee = totalLoanAmount - values.systemCost;
    const monthlyPayment = calculateMonthlyPayment(
      totalLoanAmount,
      values.annualRate,
      values.termMonths
    );
    const totalCost = monthlyPayment * values.termMonths;
    
    const yearlyProjections = calculateYearlyProjections(
      monthlyPayment,
      values.monthlyBill,
      values.termMonths
    );

    setResults({
      monthlyPayment,
      totalLoanAmount,
      actualDealerFee,
      totalCost,
      yearlyProjections,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <TooltipProvider>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Solar Calculator</h1>
            <p className="text-muted-foreground">Calculate your solar investment and savings over time</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="tesla-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    System Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="systemCost"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          System Cost
                          <UITooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              The total cost of your solar system
                            </TooltipContent>
                          </UITooltip>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter system cost"
                            onChange={(e) => {
                              const value = e.target.value;
                              onChange(value === '' ? undefined : Number(value));
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dealerFee"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Dealer Fee (%)
                          <UITooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Dealer fee as a percentage of the system cost
                            </TooltipContent>
                          </UITooltip>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter dealer fee"
                            onChange={(e) => {
                              const value = e.target.value;
                              onChange(value === '' ? undefined : Number(value));
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="annualRate"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Annual Rate (%)
                          <UITooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Annual interest rate for financing
                            </TooltipContent>
                          </UITooltip>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="Enter annual rate"
                            onChange={(e) => {
                              const value = e.target.value;
                              onChange(value === '' ? undefined : Number(value));
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termMonths"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Term (Months)
                          <UITooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Loan term in months
                            </TooltipContent>
                          </UITooltip>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter term length"
                            onChange={(e) => {
                              const value = e.target.value;
                              onChange(value === '' ? undefined : Number(value));
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyBill"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Monthly Electric Bill
                          <UITooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Your current monthly electricity bill
                            </TooltipContent>
                          </UITooltip>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter monthly bill"
                            onChange={(e) => {
                              const value = e.target.value;
                              onChange(value === '' ? undefined : Number(value));
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" className="w-full gradient-button">
                Calculate Savings
              </Button>
            </form>
          </Form>

          {results && (
            <div className="space-y-8 animate-slide-up">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="tesla-card bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Monthly Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" style={{ color: '#f5811b' }}>
                      {formatCurrency(results.monthlyPayment)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="tesla-card bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      25-Year Savings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" style={{ color: '#51f51b' }}>
                      {formatCurrency(
                        results.yearlyProjections.reduce(
                          (acc, year) => acc + (year.withoutSolar - year.withSolar),
                          0
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="tesla-card bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Loan Amount
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="secondary-results">
                      {formatCurrency(results.totalLoanAmount)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="tesla-card bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Actual Dealer Fee
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="secondary-results">
                      {formatCurrency(results.actualDealerFee)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="tesla-card bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Cost of Financing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="secondary-results">
                      {formatCurrency(results.totalCost)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="tesla-card bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    Cost Comparison Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={results.yearlyProjections}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="year"
                          stroke="hsl(var(--muted-foreground))"
                          label={{
                            value: 'Year',
                            position: 'bottom',
                            style: { fill: 'hsl(var(--muted-foreground))' }
                          }}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          label={{
                            value: 'Annual Cost',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: 'hsl(var(--muted-foreground))' }
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                          }}
                          formatter={(value: number) => [formatCurrency(value), '']}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="withoutSolar"
                          name="Without Solar"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="withSolar"
                          name="With Solar"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}