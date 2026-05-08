"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { CircleDollarSign } from "lucide-react";
import { BudgetUpdateForm } from "@/components/budget-update-form";
import type { BudgetItem } from "@/lib/types";

type BudgetUpdateDisclosureProps = {
  proposalId: string;
  currency: string;
  latestItems: BudgetItem[];
};

export function BudgetUpdateDisclosure({ proposalId, currency, latestItems }: BudgetUpdateDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="disclosure budget-update-disclosure">
      <Button className="brand-button budget-update-button" onPress={() => setIsOpen((current) => !current)}>
        <CircleDollarSign size={18} aria-hidden="true" />
        <span className="budget-update-label-desktop">Modificar presupuesto</span>
        <span className="budget-update-label-mobile">Modificar</span>
      </Button>
      {isOpen ? (
        <div className="disclosure-panel">
          <BudgetUpdateForm proposalId={proposalId} currency={currency} latestItems={latestItems} onSaved={() => setIsOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
