import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UnitConverter() {
  const [amount, setAmount] = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [convertedAmount, setConvertedAmount] = useState("");
  const [activeCategory, setActiveCategory] = useState("length");
  const { toast } = useToast();

  const unitCategories = {
    length: {
      name: "Length",
      units: [
        { code: "mm", name: "Millimeter", toBase: 0.001 },
        { code: "cm", name: "Centimeter", toBase: 0.01 },
        { code: "m", name: "Meter", toBase: 1 },
        { code: "km", name: "Kilometer", toBase: 1000 },
        { code: "in", name: "Inch", toBase: 0.0254 },
        { code: "ft", name: "Foot", toBase: 0.3048 },
        { code: "yd", name: "Yard", toBase: 0.9144 },
        { code: "mi", name: "Mile", toBase: 1609.34 },
      ]
    },
    weight: {
      name: "Weight",
      units: [
        { code: "mg", name: "Milligram", toBase: 0.000001 },
        { code: "g", name: "Gram", toBase: 0.001 },
        { code: "kg", name: "Kilogram", toBase: 1 },
        { code: "oz", name: "Ounce", toBase: 0.0283495 },
        { code: "lb", name: "Pound", toBase: 0.453592 },
        { code: "ton", name: "Metric Ton", toBase: 1000 },
      ]
    },
    temperature: {
      name: "Temperature",
      units: [
        { code: "c", name: "Celsius", toBase: 1 },
        { code: "f", name: "Fahrenheit", toBase: 1 },
        { code: "k", name: "Kelvin", toBase: 1 },
      ]
    },
    volume: {
      name: "Volume",
      units: [
        { code: "ml", name: "Milliliter", toBase: 0.001 },
        { code: "l", name: "Liter", toBase: 1 },
        { code: "gal", name: "Gallon (US)", toBase: 3.78541 },
        { code: "qt", name: "Quart (US)", toBase: 0.946353 },
        { code: "pt", name: "Pint (US)", toBase: 0.473176 },
        { code: "cup", name: "Cup (US)", toBase: 0.236588 },
        { code: "fl-oz", name: "Fluid Ounce (US)", toBase: 0.0295735 },
      ]
    }
  };

  const convertValue = (value: number, from: string, to: string, category: string) => {
    if (category === "temperature") {
      // Temperature conversions
      let celsius = value;
      if (from === "f") celsius = (value - 32) * 5/9;
      if (from === "k") celsius = value - 273.15;
      
      if (to === "f") return celsius * 9/5 + 32;
      if (to === "k") return celsius + 273.15;
      return celsius;
    } else {
      // Linear conversions
      const fromUnit = unitCategories[category].units.find(u => u.code === from);
      const toUnit = unitCategories[category].units.find(u => u.code === to);
      
      if (!fromUnit || !toUnit) return 0;
      
      const baseValue = value * fromUnit.toBase;
      return baseValue / toUnit.toBase;
    }
  };

  const handleConvert = () => {
    if (!amount || !fromUnit || !toUnit) {
      toast({
        title: "Missing values",
        description: "Please fill all fields to convert",
        variant: "destructive"
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number",
        variant: "destructive"
      });
      return;
    }

    const result = convertValue(numericAmount, fromUnit, toUnit, activeCategory);
    setConvertedAmount(result.toFixed(6).replace(/\.?0+$/, ""));
    
    toast({
      title: "Conversion Complete",
      description: `${amount} ${fromUnit} = ${result.toFixed(4)} ${toUnit}`
    });
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setConvertedAmount("");
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setFromUnit("");
    setToUnit("");
    setConvertedAmount("");
  };

  return (
    <PageLayout
      title="Unit Converter"
      description="Convert length, weight, temperature and more"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
              <TabsList className="grid w-full grid-cols-4">
                {Object.entries(unitCategories).map(([key, category]) => (
                  <TabsTrigger key={key} value={key}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(unitCategories).map(([key, category]) => (
                <TabsContent key={key} value={key} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount to Convert</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      step="any"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>From Unit</Label>
                      <Select value={fromUnit} onValueChange={setFromUnit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {category.units.map((unit) => (
                            <SelectItem key={unit.code} value={unit.code}>
                              {unit.name} ({unit.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-center">
                      <Button variant="outline" size="sm" onClick={swapUnits}>
                        <ArrowLeftRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>To Unit</Label>
                      <Select value={toUnit} onValueChange={setToUnit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {category.units.map((unit) => (
                            <SelectItem key={unit.code} value={unit.code}>
                              {unit.name} ({unit.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {convertedAmount && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Scale className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-medium text-blue-600">Conversion Result</h3>
                        </div>
                        <p className="text-2xl font-bold">
                          {amount} {fromUnit} = {convertedAmount} {toUnit}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleConvert}
                    disabled={!amount || !fromUnit || !toUnit}
                    className="w-full"
                  >
                    Convert {category.name}
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}