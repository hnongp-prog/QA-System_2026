import React from 'react';
import {
  PackageCheck,
  Truck,
  Activity,
  Zap,
  ClipboardCheck,
  Wrench,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Package,
  Layers,
  FileCheck,
  Gauge,
  Sliders
} from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-6 h-6' }) => {
  switch (name) {
    case 'PackageCheck':
      return <PackageCheck className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'ClipboardCheck':
      return <ClipboardCheck className={className} />;
    case 'TruckCheck':
      return <Truck className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'AlertTriangle':
      return <AlertTriangle className={className} />;
    case 'BarChart3':
      return <BarChart3 className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Gauge':
      return <Gauge className={className} />;
    case 'Sliders':
      return <Sliders className={className} />;
    default:
      return <Package className={className} />;
  }
};
