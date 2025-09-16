import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CurrencyConverter() {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  ];

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to convert",
        variant: "destructive"
      });
      return;
    }

    setIsConverting(true);
    // Simulate API call for currency conversion
    setTimeout(() => {
      // Mock conversion rate (in real app, this would come from an API)
      const mockRate = 0.85; // Example: 1 USD = 0.85 EUR
      const result = (parseFloat(amount) * mockRate).toFixed(2);
      setConvertedAmount(result);
      setIsConverting(false);
      toast({
        title: "Conversion Complete",
        description: `${amount} ${fromCurrency} = ${result} ${toCurrency}`
      });
    }, 1500);
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount("");
  };

  return (
    <PageLayout
      title="Currency Converter"
      description="Convert between different currencies with live exchange rates"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Convert</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>From Currency</Label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={swapCurrencies}>
                  <ArrowLeftRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>To Currency</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {convertedAmount && (
              <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-medium text-green-600">Conversion Result</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {amount} {fromCurrency} = {convertedAmount} {toCurrency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Exchange rate: 1 {fromCurrency} = 0.85 {toCurrency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      *Rates are for demonstration purposes only
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleConvert}
              disabled={!amount || isConverting || fromCurrency === toCurrency}
              className="w-full"
            >
              {isConverting ? "Converting..." : "Convert Currency"}
            </Button>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Exchange rates are updated regularly. This tool uses mock rates for demonstration.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}