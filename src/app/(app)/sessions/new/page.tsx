"use client";

import type { NewSessionData } from "@/lib/page-data-types";
import { PageDataState, useApiData } from "../../api-data";
import { NewSessionForm } from "./new-session-form";

export default function NewSession() {
  const { data, error, loading, retry } =
    useApiData<NewSessionData>("/api/app/new-session");
  if (!data) {
    return <PageDataState loading={loading} error={error} retry={retry} />;
  }
  return (
    <NewSessionForm
      players={data.players}
      defaults={data.defaults}
    />
  );
}
