import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import type { DialogProps } from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

export interface ModalProps extends Omit<DialogProps, 'open' | 'onClose'> {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  ariaLabel?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface ModalRef {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

export const Modal = forwardRef<ModalRef, ModalProps>(
  (
    {
      children,
      title,
      actions,
      open: controlledOpen,
      onClose,
      closeOnEsc = true,
      showCloseButton = true,
      ariaLabel,
      size = 'sm',
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const [internalOpen, setInternalOpen] = useState(false);
    
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    useImperativeHandle(ref, () => ({
      open: () => {
        if (!isControlled) {
          setInternalOpen(true);
        }
      },
      close: () => {
        if (!isControlled) {
          setInternalOpen(false);
        }
        onClose?.();
      },
      isOpen: open,
    }));

    const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (reason === 'escapeKeyDown' && !closeOnEsc) {
        return;
      }
      
      if (!isControlled) {
        setInternalOpen(false);
      }
      onClose?.();
    };

    const handleCloseButtonClick = () => {
      if (!isControlled) {
        setInternalOpen(false);
      }
      onClose?.();
    };

    useEffect(() => {
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && open && closeOnEsc) {
          handleCloseButtonClick();
        }
      };

      if (open) {
        document.addEventListener('keydown', handleEscKey);
      }

      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }, [open, closeOnEsc]);

    return (
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth={fullWidth}
        maxWidth={size}
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby="modal-content"
        aria-label={ariaLabel}
        {...props}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: theme.shape.borderRadius * 1.5,
            boxShadow: theme.shadows[24],
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          ...props.sx,
        }}
      >
        {title && (
          <DialogTitle
            id="modal-title"
            sx={{
              m: 0,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {title}
            {showCloseButton && (
              <IconButton
                aria-label="Close modal"
                onClick={handleCloseButtonClick}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: theme.palette.grey[500],
                  '&:hover': {
                    color: theme.palette.grey[700],
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
        )}
        <DialogContent
          id="modal-content"
          sx={{
            p: 3,
            position: 'relative',
          }}
        >
          {children}
        </DialogContent>
        {actions && (
          <DialogActions
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            {actions}
          </DialogActions>
        )}
      </Dialog>
    );
  }
);

Modal.displayName = 'Modal';