import React from 'react';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  showHome?: boolean;
  homeLabel?: string;
  homePath?: string;
  ariaLabel?: string;
  onNavigate?: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = <NavigateNextIcon fontSize="small" />,
  maxItems = 8,
  showHome = true,
  homeLabel = 'Home',
  homePath = '/',
  ariaLabel = 'breadcrumb navigation',
  onNavigate,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const generateBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    
    const breadcrumbs: BreadcrumbItem[] = [];
    
    if (showHome) {
      breadcrumbs.push({
        label: homeLabel,
        path: homePath,
        icon: <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />,
      });
    }

    pathnames.forEach((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
      
      breadcrumbs.push({
        label,
        path,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbsFromPath();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <MuiBreadcrumbs
      separator={separator}
      maxItems={maxItems}
      aria-label={ariaLabel}
      sx={{
        '& .MuiBreadcrumbs-ol': {
          flexWrap: 'nowrap',
        },
        '& .MuiBreadcrumbs-li': {
          whiteSpace: 'nowrap',
        },
      }}
    >
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        if (isLast || !item.path) {
          return (
            <Typography
              key={index}
              color="text.primary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: theme.typography.fontWeightMedium,
              }}
            >
              {item.icon}
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={index}
            color="inherit"
            href={item.path}
            onClick={(e) => handleClick(e, item.path!)}
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                color: theme.palette.primary.main,
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
                borderRadius: theme.shape.borderRadius / 2,
              },
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};