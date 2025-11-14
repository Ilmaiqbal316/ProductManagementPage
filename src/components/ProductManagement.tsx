import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Eye, GripVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type FieldType = 'text' | 'number' | 'dropdown';
type PricingModel = 'base' | 'perCharacter' | 'perUnit';

interface DropdownOption {
  id: string;
  name: string;
  price: number;
}

interface SpecialField {
  id: string;
  label: string;
  type: FieldType;
  pricingModel: PricingModel;
  price: number;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  dropdownOptions?: DropdownOption[];
}

interface ProductData {
  name: string;
  description: string;
  basePrice: number;
  specialFieldsEnabled: boolean;
  specialFields: SpecialField[];
}

interface CustomerValues {
  [key: string]: string | number;
}

const ProductManagement = () => {
  const [product, setProduct] = useState<ProductData>({
    name: '',
    description: '',
    basePrice: 0,
    specialFieldsEnabled: false,
    specialFields: [],
  });

  const [customerValues, setCustomerValues] = useState<CustomerValues>({});

  const loadExample = () => {
    const exampleProduct: ProductData = {
      name: 'Custom T-Shirt',
      description: 'Personalized cotton t-shirt with custom text',
      basePrice: 25.0,
      specialFieldsEnabled: true,
      specialFields: [
        {
          id: '1',
          label: 'Engraving Text',
          type: 'text',
          pricingModel: 'perCharacter',
          price: 0.5,
          minLength: 1,
          maxLength: 50,
        },
        {
          id: '2',
          label: 'Size',
          type: 'dropdown',
          pricingModel: 'base',
          price: 0,
          dropdownOptions: [
            { id: 'opt1', name: 'Small', price: 0 },
            { id: 'opt2', name: 'Medium', price: 2 },
            { id: 'opt3', name: 'Large', price: 4 },
            { id: 'opt4', name: 'XL', price: 6 },
          ],
        },
      ],
    };
    setProduct(exampleProduct);
    setCustomerValues({});
    toast({
      title: 'Example Loaded',
      description: 'Sample product configuration has been loaded.',
    });
  };

  const addSpecialField = () => {
    if (product.specialFields.length >= 4) {
      toast({
        title: 'Maximum Reached',
        description: 'You can only add up to 4 special fields.',
        variant: 'destructive',
      });
      return;
    }

    const newField: SpecialField = {
      id: Date.now().toString(),
      label: '',
      type: 'text',
      pricingModel: 'base',
      price: 0,
    };

    setProduct({
      ...product,
      specialFields: [...product.specialFields, newField],
    });
  };

  const removeSpecialField = (id: string) => {
    setProduct({
      ...product,
      specialFields: product.specialFields.filter((field) => field.id !== id),
    });
    const newCustomerValues = { ...customerValues };
    delete newCustomerValues[id];
    setCustomerValues(newCustomerValues);
  };

  const updateSpecialField = (id: string, updates: Partial<SpecialField>) => {
    setProduct({
      ...product,
      specialFields: product.specialFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      ),
    });
  };

  const addDropdownOption = (fieldId: string) => {
    const field = product.specialFields.find((f) => f.id === fieldId);
    if (!field || !field.dropdownOptions) return;

    const newOption: DropdownOption = {
      id: Date.now().toString(),
      name: '',
      price: 0,
    };

    updateSpecialField(fieldId, {
      dropdownOptions: [...field.dropdownOptions, newOption],
    });
  };

  const removeDropdownOption = (fieldId: string, optionId: string) => {
    const field = product.specialFields.find((f) => f.id === fieldId);
    if (!field || !field.dropdownOptions) return;

    updateSpecialField(fieldId, {
      dropdownOptions: field.dropdownOptions.filter((opt) => opt.id !== optionId),
    });
  };

  const updateDropdownOption = (
    fieldId: string,
    optionId: string,
    updates: Partial<DropdownOption>
  ) => {
    const field = product.specialFields.find((f) => f.id === fieldId);
    if (!field || !field.dropdownOptions) return;

    updateSpecialField(fieldId, {
      dropdownOptions: field.dropdownOptions.map((opt) =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ),
    });
  };

  const calculateTotalPrice = (): number => {
    let total = product.basePrice;

    product.specialFields.forEach((field) => {
      const value = customerValues[field.id];

      if (field.type === 'text' && value && typeof value === 'string') {
        if (field.pricingModel === 'perCharacter') {
          total += value.length * field.price;
        } else if (field.pricingModel === 'base') {
          total += field.price;
        }
      } else if (field.type === 'number' && value && typeof value === 'number') {
        if (field.pricingModel === 'perUnit') {
          total += value * field.price;
        } else if (field.pricingModel === 'base') {
          total += field.price;
        }
      } else if (field.type === 'dropdown' && value) {
        const option = field.dropdownOptions?.find((opt) => opt.id === value);
        if (option) {
          total += option.price;
        }
      }
    });

    return total;
  };

  const validateProduct = (): boolean => {
    if (!product.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Product name is required.',
        variant: 'destructive',
      });
      return false;
    }

    if (product.basePrice < 0) {
      toast({
        title: 'Validation Error',
        description: 'Base price must be greater than or equal to 0.',
        variant: 'destructive',
      });
      return false;
    }

    if (product.specialFieldsEnabled) {
      const labels = product.specialFields.map((f) => f.label.trim().toLowerCase());
      const uniqueLabels = new Set(labels);

      if (labels.some((l) => !l)) {
        toast({
          title: 'Validation Error',
          description: 'All special field labels are required.',
          variant: 'destructive',
        });
        return false;
      }

      if (labels.length !== uniqueLabels.size) {
        toast({
          title: 'Validation Error',
          description: 'Special field labels must be unique.',
          variant: 'destructive',
        });
        return false;
      }

      for (const field of product.specialFields) {
        if (field.price < 0) {
          toast({
            title: 'Validation Error',
            description: 'All prices must be greater than or equal to 0.',
            variant: 'destructive',
          });
          return false;
        }

        if (field.type === 'dropdown' && field.dropdownOptions) {
          const optionNames = field.dropdownOptions
            .map((opt) => opt.name.trim().toLowerCase())
            .filter((n) => n);
          const uniqueOptionNames = new Set(optionNames);

          if (field.dropdownOptions.some((opt) => !opt.name.trim())) {
            toast({
              title: 'Validation Error',
              description: 'All dropdown option names are required.',
              variant: 'destructive',
            });
            return false;
          }

          if (optionNames.length !== uniqueOptionNames.size) {
            toast({
              title: 'Validation Error',
              description: 'Dropdown option names must be unique within the same field.',
              variant: 'destructive',
            });
            return false;
          }

          if (field.dropdownOptions.some((opt) => opt.price < 0)) {
            toast({
              title: 'Validation Error',
              description: 'All dropdown option prices must be greater than or equal to 0.',
              variant: 'destructive',
            });
            return false;
          }
        }
      }
    }

    return true;
  };

  const saveProduct = () => {
    if (!validateProduct()) return;

    console.log('Product Configuration:', product);
    toast({
      title: 'Product Saved',
      description: 'Product configuration has been saved successfully.',
    });
  };

  const resetForm = () => {
    setProduct({
      name: '',
      description: '',
      basePrice: 0,
      specialFieldsEnabled: false,
      specialFields: [],
    });
    setCustomerValues({});
    toast({
      title: 'Form Reset',
      description: 'All fields have been cleared.',
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your product with customizable special fields
            </p>
          </div>
          <Button variant="outline" onClick={loadExample}>
            Load Example
          </Button>
        </div>

        {/* Basic Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="productName"
                placeholder="Enter product name"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productDescription">Product Description</Label>
              <Textarea
                id="productDescription"
                placeholder="Enter product description"
                rows={4}
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="basePrice">
                Base Price ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="basePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={product.basePrice || ''}
                onChange={(e) =>
                  setProduct({ ...product, basePrice: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Enable Special Fields */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="enableSpecialFields"
                checked={product.specialFieldsEnabled}
                onCheckedChange={(checked) =>
                  setProduct({
                    ...product,
                    specialFieldsEnabled: checked as boolean,
                  })
                }
              />
              <div className="flex-1">
                <label
                  htmlFor="enableSpecialFields"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Enable Special Fields
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Add up to 4 customizable fields to collect additional product information and pricing
                </p>
              </div>
            </div>

            {product.specialFieldsEnabled && (
              <div className="mt-6 space-y-4">
                {product.specialFields.map((field, index) => (
                  <Card key={field.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <h3 className="text-sm font-semibold">Special Field #{index + 1}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSpecialField(field.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>
                              Special Field Label <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              placeholder="e.g., Size, Color, Engraving Text"
                              value={field.label}
                              onChange={(e) =>
                                updateSpecialField(field.id, { label: e.target.value })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Special Field Type <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: FieldType) => {
                                const updates: Partial<SpecialField> = { type: value };
                                if (value === 'dropdown') {
                                  updates.dropdownOptions = [
                                    { id: Date.now().toString(), name: '', price: 0 },
                                  ];
                                  updates.pricingModel = 'base';
                                } else if (value === 'text') {
                                  updates.pricingModel = 'base';
                                  delete updates.dropdownOptions;
                                } else if (value === 'number') {
                                  updates.pricingModel = 'base';
                                  delete updates.dropdownOptions;
                                }
                                updateSpecialField(field.id, updates);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="dropdown">Dropdown</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {field.type !== 'dropdown' && (
                          <>
                            <div className="space-y-3">
                              <Label>
                                Pricing Model <span className="text-destructive">*</span>
                              </Label>
                              <RadioGroup
                                value={field.pricingModel}
                                onValueChange={(value: PricingModel) =>
                                  updateSpecialField(field.id, { pricingModel: value })
                                }
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="base" id={`${field.id}-base`} />
                                  <Label htmlFor={`${field.id}-base`} className="font-normal">
                                    Base Price (Fixed additional price)
                                    {field.type === 'text' && (
                                      <span className="text-muted-foreground text-xs ml-1">
                                        - Add fixed price regardless of text length
                                      </span>
                                    )}
                                  </Label>
                                </div>
                                {field.type === 'text' && (
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="perCharacter"
                                      id={`${field.id}-perCharacter`}
                                    />
                                    <Label
                                      htmlFor={`${field.id}-perCharacter`}
                                      className="font-normal"
                                    >
                                      Per Character Price (Price × character count)
                                      <span className="text-muted-foreground text-xs ml-1">
                                        - Price is multiplied by the number of characters entered
                                      </span>
                                    </Label>
                                  </div>
                                )}
                                {field.type === 'number' && (
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="perUnit" id={`${field.id}-perUnit`} />
                                    <Label htmlFor={`${field.id}-perUnit`} className="font-normal">
                                      Per Unit Price (Price × quantity)
                                      <span className="text-muted-foreground text-xs ml-1">
                                        - Price is multiplied by the quantity entered
                                      </span>
                                    </Label>
                                  </div>
                                )}
                              </RadioGroup>
                            </div>

                            <div className="space-y-2">
                              <Label>
                                Base Price ($) <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={field.price || ''}
                                onChange={(e) =>
                                  updateSpecialField(field.id, {
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>

                            {field.type === 'text' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Minimum Length (optional)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="No minimum"
                                    value={field.minLength || ''}
                                    onChange={(e) =>
                                      updateSpecialField(field.id, {
                                        minLength: parseInt(e.target.value) || undefined,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Maximum Length (optional)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="No maximum"
                                    value={field.maxLength || ''}
                                    onChange={(e) =>
                                      updateSpecialField(field.id, {
                                        maxLength: parseInt(e.target.value) || undefined,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}

                            {field.type === 'number' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Minimum Value (optional)</Label>
                                  <Input
                                    type="number"
                                    placeholder="No minimum"
                                    value={field.minValue ?? ''}
                                    onChange={(e) =>
                                      updateSpecialField(field.id, {
                                        minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Maximum Value (optional)</Label>
                                  <Input
                                    type="number"
                                    placeholder="No maximum"
                                    value={field.maxValue ?? ''}
                                    onChange={(e) =>
                                      updateSpecialField(field.id, {
                                        maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}

                            <div className="bg-accent/50 p-3 rounded-md">
                              <p className="text-sm text-accent-foreground">
                                <span className="font-medium">Example:</span> Customer pays $
                                {field.price.toFixed(2)} fixed price
                                {field.pricingModel === 'perCharacter' &&
                                  ' × number of characters'}
                                {field.pricingModel === 'perUnit' && ' × quantity'}
                              </p>
                            </div>
                          </>
                        )}

                        {field.type === 'dropdown' && field.dropdownOptions && (
                          <div className="space-y-3">
                            <Label>Dropdown Options</Label>
                            {field.dropdownOptions.map((option, optIndex) => (
                              <div key={option.id} className="flex gap-2">
                                <div className="flex-1">
                                  <Input
                                    placeholder="Option name"
                                    value={option.name}
                                    onChange={(e) =>
                                      updateDropdownOption(field.id, option.id, {
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="w-32">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Price"
                                    value={option.price || ''}
                                    onChange={(e) =>
                                      updateDropdownOption(field.id, option.id, {
                                        price: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDropdownOption(field.id, option.id)}
                                  disabled={field.dropdownOptions!.length <= 1}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addDropdownOption(field.id)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addSpecialField}
                  disabled={product.specialFields.length >= 4}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Special Field ({product.specialFields.length}/4)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Preview */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle>Customer Preview</CardTitle>
            </div>
            <CardDescription>
              This is how customers will see and interact with special fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-foreground">
                  {product.name || 'Product Name'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Base Price: ${product.basePrice.toFixed(2)}
                </p>
              </div>

              {product.specialFieldsEnabled &&
                product.specialFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>{field.label || 'Field Label'}</Label>
                    {field.type === 'text' && (
                      <Input
                        placeholder="Enter"
                        value={(customerValues[field.id] as string) || ''}
                        onChange={(e) =>
                          setCustomerValues({
                            ...customerValues,
                            [field.id]: e.target.value,
                          })
                        }
                        maxLength={field.maxLength}
                      />
                    )}
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        value={(customerValues[field.id] as number) || ''}
                        min={field.minValue}
                        max={field.maxValue}
                        onChange={(e) =>
                          setCustomerValues({
                            ...customerValues,
                            [field.id]: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    )}
                    {field.type === 'dropdown' && field.dropdownOptions && (
                      <Select
                        value={(customerValues[field.id] as string) || ''}
                        onValueChange={(value) =>
                          setCustomerValues({
                            ...customerValues,
                            [field.id]: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.dropdownOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.name || 'Unnamed Option'} (+${opt.price.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Price:</span>
                  <span>${product.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Total Price:</span>
                  <span>${calculateTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={resetForm}>
            Cancel
          </Button>
          <Button variant="black" onClick={saveProduct}>Save Product</Button>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
