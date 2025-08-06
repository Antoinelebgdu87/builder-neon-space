import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FirebaseStatusProps {
  isOnline: boolean;
  error?: string | null;
}

export function FirebaseStatus({ isOnline, error }: FirebaseStatusProps) {
  if (isOnline) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-800">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Firebase connecté</AlertTitle>
        <AlertDescription>
          Synchronisation en temps réel active
        </AlertDescription>
      </Alert>
    );
  }

  if (error?.includes("Permissions insuffisantes")) {
    return (
      <Alert className="border-orange-200 bg-orange-50 text-orange-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Configuration Firebase requise</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Les permissions Firestore doivent être configurées dans la console
            Firebase.
          </p>
          <div className="space-y-2">
            <p className="font-medium">Instructions :</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Accédez à la{" "}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-orange-900"
                >
                  Console Firebase
                </a>
              </li>
              <li>Sélectionnez le projet "keysystem-d0b86"</li>
              <li>Allez dans Firestore Database → Règles</li>
              <li>Remplacez les règles par :</li>
            </ol>
            <pre className="bg-orange-100 p-2 rounded text-xs overflow-x-auto">
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                window.open(
                  "https://console.firebase.google.com/project/keysystem-d0b86/firestore/rules",
                  "_blank",
                )
              }
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ouvrir les règles Firestore
            </Button>
          </div>
          <p className="text-sm">
            💾 En attendant, l'application fonctionne en mode local.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Mode hors ligne</AlertTitle>
      <AlertDescription>
        Firebase inaccessible. Utilisation du stockage local.
      </AlertDescription>
    </Alert>
  );
}
