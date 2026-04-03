"use client";

import { useEffect, useState } from "react";
import { fetchAllowedLabels, fetchAllowedVisitCompanies } from "../../map/api";

type EventDetailsOptions = {
  labelOptions: string[];
  visitCompanyOptions: string[];
};

export function useEventDetailsOptions(): EventDetailsOptions {
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [visitCompanyOptions, setVisitCompanyOptions] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([fetchAllowedLabels(), fetchAllowedVisitCompanies()])
      .then(([labels, visitCompanies]) => {
        if (!active) {
          return;
        }

        setLabelOptions(labels);
        setVisitCompanyOptions(visitCompanies);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setLabelOptions([]);
        setVisitCompanyOptions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return { labelOptions, visitCompanyOptions };
}
