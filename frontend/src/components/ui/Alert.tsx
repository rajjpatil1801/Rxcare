import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error' | 'ai';
  title?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  action,
  className = '',
}) => {
  const configs = {
    info: {
      border: 'border-sky-200 bg-sky-50/70 text-sky-900',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
    },
    success: {
      border: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      border: 'border-amber-200 bg-amber-50/80 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    error: {
      border: 'border-rose-200 bg-rose-50/80 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    },
    ai: {
      border: 'border-purple-200 bg-gradient-to-r from-purple-50/90 to-indigo-50/90 text-purple-950',
      icon: <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />,
    },
  };

  const current = configs[type];

  return (
    <div className={`flex items-start gap-3.5 p-4 rounded-xl border ${current.border} ${className}`}>
      {current.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm leading-tight mb-1">{title}</h4>}
        <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
