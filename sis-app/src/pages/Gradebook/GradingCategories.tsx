import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  Chip,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  DragIndicator,
  Info,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Button, useToast } from '../../components';

interface GradingCategory {
  id: string;
  courseSectionId: string;
  name: string;
  weight: number;
  dropLowest: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface GradingCategoriesProps {
  courseSectionId: string;
}

interface CategoryFormData {
  name: string;
  weight: number;
  dropLowest: number;
}

const DEFAULT_CATEGORIES = [
  { name: 'Homework', weight: 20, dropLowest: 1 },
  { name: 'Quizzes', weight: 20, dropLowest: 1 },
  { name: 'Tests', weight: 40, dropLowest: 0 },
  { name: 'Projects', weight: 15, dropLowest: 0 },
  { name: 'Participation', weight: 5, dropLowest: 0 },
];

export const GradingCategories: React.FC<GradingCategoriesProps> = ({ courseSectionId }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GradingCategory | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<GradingCategory | null>(null);
  const [quickSetupDialog, setQuickSetupDialog] = useState(false);
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    weight: 0,
    dropLowest: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});

  // Fetch grading categories
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['grading-categories', courseSectionId],
    queryFn: async () => {
      const response = await api.get(`/gradebook/course-sections/${courseSectionId}/grading-categories`);
      return response.data;
    },
    enabled: !!courseSectionId,
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { displayOrder: number }) => {
      const response = await api.post(
        `/gradebook/course-sections/${courseSectionId}/grading-categories`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-categories', courseSectionId] });
      toast.success('Category created successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create category');
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      const response = await api.put(
        `/gradebook/grading-categories/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-categories', courseSectionId] });
      toast.success('Category updated successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update category');
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gradebook/grading-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-categories', courseSectionId] });
      toast.success('Category deleted successfully');
      setDeleteDialog(false);
      setCategoryToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete category');
    },
  });

  // Reorder categories mutation
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; displayOrder: number }[]) => {
      await Promise.all(
        updates.map(update =>
          api.put(`/gradebook/grading-categories/${update.id}`, {
            displayOrder: update.displayOrder,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-categories', courseSectionId] });
      toast.success('Categories reordered successfully');
    },
    onError: () => {
      toast.error('Failed to reorder categories');
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display order
    const updates = items.map((item, index) => ({
      id: item.id,
      displayOrder: index,
    }));

    reorderMutation.mutate(updates);
  };

  const handleOpenDialog = (category?: GradingCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        weight: category.weight,
        dropLowest: category.dropLowest,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        weight: 0,
        dropLowest: 0,
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      weight: 0,
      dropLowest: 0,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CategoryFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    if (formData.weight < 0 || formData.weight > 100) {
      newErrors.weight = 'Weight must be between 0 and 100';
    }
    if (formData.dropLowest < 0) {
      newErrors.dropLowest = 'Drop lowest must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: formData,
      });
    } else {
      createMutation.mutate({
        ...formData,
        displayOrder: categories.length,
      });
    }
  };

  const handleDelete = (category: GradingCategory) => {
    setCategoryToDelete(category);
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const handleQuickSetup = async () => {
    try {
      // Delete existing categories
      await Promise.all(categories.map((cat: GradingCategory) => 
        api.delete(`/gradebook/grading-categories/${cat.id}`)
      ));

      // Create default categories
      await Promise.all(DEFAULT_CATEGORIES.map((cat, index) =>
        api.post(`/gradebook/course-sections/${courseSectionId}/grading-categories`, {
          ...cat,
          displayOrder: index,
        })
      ));

      queryClient.invalidateQueries({ queryKey: ['grading-categories', courseSectionId] });
      toast.success('Default categories created successfully');
      setQuickSetupDialog(false);
    } catch (error) {
      toast.error('Failed to set up default categories');
    }
  };

  const totalWeight = categories.reduce((sum: number, cat: GradingCategory) => sum + cat.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  if (error) {
    return (
      <Alert severity="error">
        Error loading grading categories. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Grading Categories</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure how assignments are weighted in grade calculation
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {categories.length === 0 && (
            <Button
              variant="outlined"
              onClick={() => setQuickSetupDialog(true)}
            >
              Quick Setup
            </Button>
          )}
          <Button
            variant="contained"
            icon={<Add />}
            iconPosition="start"
            onClick={() => handleOpenDialog()}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      {!isWeightValid && categories.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Total weight is {totalWeight}%. Categories should total 100% for accurate grade calculation.
        </Alert>
      )}

      {isLoading ? (
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={300} />
        </Paper>
      ) : categories.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50}></TableCell>
                <TableCell>Category Name</TableCell>
                <TableCell align="center">Weight</TableCell>
                <TableCell align="center">Drop Lowest</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                    {categories.map((category: GradingCategory, index: number) => (
                      <Draggable key={category.id} draggableId={category.id} index={index}>
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              backgroundColor: snapshot.isDragging ? 'action.hover' : 'inherit',
                            }}
                          >
                            <TableCell {...provided.dragHandleProps}>
                              <DragIndicator color="action" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {category.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${category.weight}%`}
                                size="small"
                                color={category.weight > 0 ? 'primary' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {category.dropLowest > 0 ? (
                                <Tooltip title="Number of lowest scores to drop from this category">
                                  <Chip
                                    label={category.dropLowest}
                                    size="small"
                                    color="secondary"
                                    icon={<Info fontSize="small" />}
                                  />
                                </Tooltip>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  None
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(category)}
                                title="Edit"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(category)}
                                color="error"
                                title="Delete"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                        Total Weight
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${totalWeight}%`}
                          color={isWeightValid ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Droppable>
            </DragDropContext>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Grading Categories
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set up grading categories to define how assignments are weighted in grade calculation
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setQuickSetupDialog(true)}
            >
              Use Default Categories
            </Button>
            <Button
              variant="contained"
              icon={<Add />}
              iconPosition="start"
              onClick={() => handleOpenDialog()}
            >
              Create Custom Category
            </Button>
          </Box>
        </Paper>
      )}

      {/* Category Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            <TextField
              fullWidth
              label="Weight"
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
              error={!!errors.weight}
              helperText={errors.weight || 'Percentage of final grade (0-100)'}
              required
              InputProps={{
                inputProps: { min: 0, max: 100, step: 5 },
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Drop Lowest"
              type="number"
              value={formData.dropLowest}
              onChange={(e) => setFormData({ ...formData, dropLowest: Number(e.target.value) })}
              error={!!errors.dropLowest}
              helperText={errors.dropLowest || 'Number of lowest scores to drop (0 for none)'}
              InputProps={{
                inputProps: { min: 0, max: 10 }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={handleCloseDialog}
            icon={<Cancel />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            icon={<Save />}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{categoryToDelete?.name}"? 
            All assignments in this category will need to be reassigned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDeleteDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Setup Dialog */}
      <Dialog open={quickSetupDialog} onClose={() => setQuickSetupDialog(false)}>
        <DialogTitle>Quick Setup - Default Categories</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will create the following default categories:
          </Typography>
          <Box sx={{ mt: 2 }}>
            {DEFAULT_CATEGORIES.map((cat) => (
              <Box key={cat.name} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography>{cat.name}</Typography>
                <Typography color="text.secondary">
                  {cat.weight}% {cat.dropLowest > 0 && `(drop ${cat.dropLowest})`}
                </Typography>
              </Box>
            ))}
          </Box>
          {categories.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This will replace all existing categories!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setQuickSetupDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleQuickSetup}
          >
            Create Default Categories
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GradingCategories;