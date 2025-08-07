import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Plus, Save, Award, Percent, Edit, Trash2 } from 'lucide-react';

interface GradingSettingsProps {
  onSettingsChange: () => void;
}

interface GradeScale {
  letter: string;
  minPercent: number;
  maxPercent: number;
  gpaValue: number;
  color: string;
}

interface GradeCategory {
  id: string;
  name: string;
  defaultWeight: number;
}

export default function GradingSettings({ onSettingsChange }: GradingSettingsProps) {
  const [gradeScale, setGradeScale] = useState<GradeScale[]>([
    { letter: 'A+', minPercent: 97, maxPercent: 100, gpaValue: 4.0, color: 'green' },
    { letter: 'A', minPercent: 93, maxPercent: 96.99, gpaValue: 4.0, color: 'green' },
    { letter: 'A-', minPercent: 90, maxPercent: 92.99, gpaValue: 3.7, color: 'green' },
    { letter: 'B+', minPercent: 87, maxPercent: 89.99, gpaValue: 3.3, color: 'blue' },
    { letter: 'B', minPercent: 83, maxPercent: 86.99, gpaValue: 3.0, color: 'blue' },
    { letter: 'B-', minPercent: 80, maxPercent: 82.99, gpaValue: 2.7, color: 'blue' },
    { letter: 'C+', minPercent: 77, maxPercent: 79.99, gpaValue: 2.3, color: 'yellow' },
    { letter: 'C', minPercent: 73, maxPercent: 76.99, gpaValue: 2.0, color: 'yellow' },
    { letter: 'C-', minPercent: 70, maxPercent: 72.99, gpaValue: 1.7, color: 'yellow' },
    { letter: 'D+', minPercent: 67, maxPercent: 69.99, gpaValue: 1.3, color: 'orange' },
    { letter: 'D', minPercent: 63, maxPercent: 66.99, gpaValue: 1.0, color: 'orange' },
    { letter: 'D-', minPercent: 60, maxPercent: 62.99, gpaValue: 0.7, color: 'orange' },
    { letter: 'F', minPercent: 0, maxPercent: 59.99, gpaValue: 0.0, color: 'red' },
  ]);

  const [gradeCategories, setGradeCategories] = useState<GradeCategory[]>([
    { id: '1', name: 'Tests', defaultWeight: 40 },
    { id: '2', name: 'Quizzes', defaultWeight: 20 },
    { id: '3', name: 'Homework', defaultWeight: 20 },
    { id: '4', name: 'Projects', defaultWeight: 15 },
    { id: '5', name: 'Participation', defaultWeight: 5 },
  ]);

  const [settings, setSettings] = useState({
    gpaScale: '4.0',
    includeWeightedGPA: true,
    honorRollMinGPA: 3.5,
    highHonorRollMinGPA: 3.8,
    failingGrade: 'F',
    passingPercent: 60,
    roundingMethod: 'standard', // standard, up, down
    decimalPlaces: 2,
    allowExtraCredit: true,
    maxExtraCredit: 10, // percentage
    dropLowestGrade: false,
    numberOfGradesToDrop: 1,
  });

  const [newCategory, setNewCategory] = useState({ name: '', defaultWeight: 0 });
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.name || newCategory.defaultWeight < 0) {
      toast({
        title: 'Error',
        description: 'Please provide valid category details',
        variant: 'destructive',
      });
      return;
    }

    const category: GradeCategory = {
      id: Date.now().toString(),
      ...newCategory,
    };

    setGradeCategories(prev => [...prev, category]);
    setNewCategory({ name: '', defaultWeight: 0 });
    setShowCategoryForm(false);
    onSettingsChange();

    toast({
      title: 'Success',
      description: 'Grade category added successfully',
    });
  };

  const handleDeleteCategory = (id: string) => {
    setGradeCategories(prev => prev.filter(c => c.id !== id));
    onSettingsChange();
    
    toast({
      title: 'Success',
      description: 'Grade category deleted',
    });
  };

  const handleScaleChange = (index: number, field: keyof GradeScale, value: any) => {
    const newScale = [...gradeScale];
    newScale[index] = { ...newScale[index], [field]: value };
    setGradeScale(newScale);
    onSettingsChange();
  };

  const handleSettingChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  const handleSave = () => {
    toast({
      title: 'Success',
      description: 'Grading settings saved successfully',
    });
  };

  return (
    <div className="space-y-6">
      {/* Grade Scale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Grade Scale
          </CardTitle>
          <CardDescription>
            Configure letter grades and their corresponding percentages and GPA values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Letter Grade</TableHead>
                <TableHead>Min %</TableHead>
                <TableHead>Max %</TableHead>
                <TableHead>GPA Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradeScale.map((grade, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={grade.letter}
                      onChange={(e) => handleScaleChange(index, 'letter', e.target.value)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={grade.minPercent}
                      onChange={(e) => handleScaleChange(index, 'minPercent', parseFloat(e.target.value))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={grade.maxPercent}
                      onChange={(e) => handleScaleChange(index, 'maxPercent', parseFloat(e.target.value))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={grade.gpaValue}
                      onChange={(e) => handleScaleChange(index, 'gpaValue', parseFloat(e.target.value))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setGradeScale(prev => prev.filter((_, i) => i !== index));
                        onSettingsChange();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setGradeScale(prev => [...prev, {
                letter: '',
                minPercent: 0,
                maxPercent: 0,
                gpaValue: 0,
                color: 'gray'
              }]);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Grade Level
          </Button>
        </CardContent>
      </Card>

      {/* Grade Categories */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Grade Categories
              </CardTitle>
              <CardDescription>
                Default grading categories and weights for courses
              </CardDescription>
            </div>
            <Button onClick={() => setShowCategoryForm(!showCategoryForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCategoryForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    placeholder="e.g., Labs"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="categoryWeight">Default Weight (%)</Label>
                  <Input
                    id="categoryWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={newCategory.defaultWeight}
                    onChange={(e) => setNewCategory({ ...newCategory, defaultWeight: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddCategory}>Add</Button>
                  <Button variant="outline" onClick={() => setShowCategoryForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Default Weight</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradeCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.defaultWeight}%</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Total Weight: {gradeCategories.reduce((sum, c) => sum + c.defaultWeight, 0)}%
              {gradeCategories.reduce((sum, c) => sum + c.defaultWeight, 0) !== 100 && 
                ' (Warning: Total should equal 100%)'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grading Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Grading Policies</CardTitle>
          <CardDescription>
            Configure school-wide grading policies and calculation methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gpaScale">GPA Scale</Label>
              <Input
                id="gpaScale"
                value={settings.gpaScale}
                onChange={(e) => handleSettingChange('gpaScale', e.target.value)}
                placeholder="4.0"
              />
            </div>

            <div>
              <Label htmlFor="passingPercent">Passing Percentage</Label>
              <Input
                id="passingPercent"
                type="number"
                value={settings.passingPercent}
                onChange={(e) => handleSettingChange('passingPercent', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="honorRoll">Honor Roll Min GPA</Label>
              <Input
                id="honorRoll"
                type="number"
                step="0.1"
                value={settings.honorRollMinGPA}
                onChange={(e) => handleSettingChange('honorRollMinGPA', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="highHonorRoll">High Honor Roll Min GPA</Label>
              <Input
                id="highHonorRoll"
                type="number"
                step="0.1"
                value={settings.highHonorRollMinGPA}
                onChange={(e) => handleSettingChange('highHonorRollMinGPA', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weightedGPA">Include Weighted GPA</Label>
                <p className="text-sm text-gray-500">Calculate weighted GPA for honors/AP courses</p>
              </div>
              <Switch
                id="weightedGPA"
                checked={settings.includeWeightedGPA}
                onCheckedChange={(checked) => handleSettingChange('includeWeightedGPA', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="extraCredit">Allow Extra Credit</Label>
                <p className="text-sm text-gray-500">Allow teachers to give extra credit assignments</p>
              </div>
              <Switch
                id="extraCredit"
                checked={settings.allowExtraCredit}
                onCheckedChange={(checked) => handleSettingChange('allowExtraCredit', checked)}
              />
            </div>

            {settings.allowExtraCredit && (
              <div className="ml-8">
                <Label htmlFor="maxExtraCredit">Max Extra Credit (%)</Label>
                <Input
                  id="maxExtraCredit"
                  type="number"
                  value={settings.maxExtraCredit}
                  onChange={(e) => handleSettingChange('maxExtraCredit', parseFloat(e.target.value))}
                  className="w-32"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dropLowest">Drop Lowest Grade</Label>
                <p className="text-sm text-gray-500">Allow dropping lowest grades in categories</p>
              </div>
              <Switch
                id="dropLowest"
                checked={settings.dropLowestGrade}
                onCheckedChange={(checked) => handleSettingChange('dropLowestGrade', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Grading Settings
        </Button>
      </div>
    </div>
  );
}