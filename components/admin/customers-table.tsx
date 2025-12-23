"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DeleteCustomerButton from "@/components/admin/delete-customer-button";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  _count?: {
    customerAppointments: number;
  };
}

interface CustomersTableProps {
  customers: Customer[];
}

export default function CustomersTable({ customers }: CustomersTableProps) {
  const t = useTranslations("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  // #region agent log
  useEffect(() => {
    const measureSpacing = () => {
      if (!inputRef.current || !iconRef.current) return;
      
      const inputEl = inputRef.current;
      const iconEl = iconRef.current;
      const computedInput = window.getComputedStyle(inputEl);
      const computedIcon = window.getComputedStyle(iconEl);
      const inputRect = inputEl.getBoundingClientRect();
      const iconRect = iconEl.getBoundingClientRect();
      
      const inputPaddingLeft = parseFloat(computedInput.paddingLeft);
      const iconLeft = parseFloat(computedIcon.left);
      const iconWidth = iconRect.width;
      const iconRightEdge = iconLeft + iconWidth;
      const gapToIcon = iconLeft - inputRect.left;
      const gapToText = inputRect.left + inputPaddingLeft - iconRightEdge;
      const inputClasses = inputEl.className;
      const iconClasses = iconEl.className;
      
      fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers-table.tsx:measureSpacing',message:'Spacing measurements',data:{inputPaddingLeft,iconLeft,iconWidth,iconRightEdge,gapToIcon,gapToText,inputClasses,iconClasses},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    };
    
    const timeoutId = setTimeout(measureSpacing, 100);
    return () => clearTimeout(timeoutId);
  }, []);
  // #endregion agent log

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.toLowerCase().trim();
    return customers.filter((customer) => {
      const nameMatch = customer.name?.toLowerCase().includes(query) || false;
      const emailMatch = customer.email?.toLowerCase().includes(query) || false;
      const phoneMatch = customer.phone?.toLowerCase().includes(query) || false;
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [customers, searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Card className="bg-gray-900 border-gray-800 flex flex-col flex-1 min-h-0">
      <CardHeader className="flex-shrink-0 px-3 sm:px-6 space-y-4">
        <CardTitle className="text-base sm:text-lg text-white">{t("allCustomers")}</CardTitle>
        <div className="relative w-full">
          <div ref={iconRef} className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchCustomersPlaceholder")}
            style={{ paddingLeft: '3.5rem' }}
            className={`w-full h-10 ${searchQuery ? 'pr-10' : 'pr-3'} bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors`}
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-6">
        {customers.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-400">
            {t("noCustomersFound")} {!process.env.DATABASE_URL && "Database not connected."}
          </p>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-400">
            {t("noCustomersMatchSearch")}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("name")}</th>
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("email")}</th>
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("phone")}</th>
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("appointments")}</th>
                  <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-2 sm:p-4 text-white text-xs sm:text-sm">{customer.name}</td>
                    <td className="p-2 sm:p-4">
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-primary hover:underline text-xs sm:text-sm break-all"
                      >
                        {customer.email}
                      </a>
                    </td>
                    <td className="p-2 sm:p-4">
                      {customer.phone ? (
                        <a
                          href={`tel:${customer.phone}`}
                          className="text-primary hover:underline text-xs sm:text-sm"
                        >
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-gray-500 text-xs sm:text-sm">-</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-4 text-white text-xs sm:text-sm">
                      {customer._count?.customerAppointments || 0}
                    </td>
                    <td className="p-2 sm:p-4 text-right">
                      <DeleteCustomerButton
                        customerId={customer.id}
                        customerName={customer.name}
                        customerEmail={customer.email}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

