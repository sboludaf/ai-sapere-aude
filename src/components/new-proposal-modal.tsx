"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import { ProposalForm } from "@/components/proposal-form";
import type { Professor } from "@/lib/types";

type NewProposalModalProps = {
  compact?: boolean;
  professors: Professor[];
};

export function NewProposalModal({ compact = false, professors }: NewProposalModalProps) {
  const state = useOverlayState();

  return (
    <>
      <Button
        aria-label="Nueva propuesta"
        className={compact ? "brand-button new-proposal-icon-button" : "brand-button"}
        isIconOnly={compact}
        onPress={state.open}
      >
        <Plus size={18} aria-hidden="true" />
        {compact ? null : "Nueva propuesta"}
      </Button>
      <Modal state={state}>
        <Modal.Backdrop>
          <Modal.Container size="full" scroll="inside" placement="center">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Nueva propuesta</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <ProposalForm professors={professors} onSuccess={state.close} />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
