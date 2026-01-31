'use client';
import { Card } from '@/components/ui';
import { FileText, Download, Upload, Building2 } from 'lucide-react';
export default function ImportCompaniesInstructions() {
  return (
    <Card className="p-6">
      {' '}
      <h3 className="text-lg font-semibold mb-4">Instructions d'import</h3>{' '}
      <div className="space-y-4">
        {' '}
        <div className="flex items-start gap-3">
          {' '}
          <FileText className="w-5 h-5 text-primary mt-0.5" />{' '}
          <div>
            {' '}
            <h4 className="font-medium mb-1">Format Excel</h4>{' '}
            <p className="text-sm text-muted-foreground">
              {' '}
              Téléchargez le modèle Excel et remplissez les colonnes requises pour les
              entreprises.{' '}
            </p>{' '}
          </div>{' '}
        </div>{' '}
        <div className="flex items-start gap-3">
          {' '}
          <Download className="w-5 h-5 text-primary mt-0.5" />{' '}
          <div>
            {' '}
            <h4 className="font-medium mb-1">Télécharger le modèle</h4>{' '}
            <p className="text-sm text-muted-foreground">
              {' '}
              Utilisez le modèle fourni pour garantir le bon format des données.{' '}
            </p>{' '}
          </div>{' '}
        </div>{' '}
        <div className="flex items-start gap-3">
          {' '}
          <Upload className="w-5 h-5 text-primary mt-0.5" />{' '}
          <div>
            {' '}
            <h4 className="font-medium mb-1">Import ZIP</h4>{' '}
            <p className="text-sm text-muted-foreground">
              {' '}
              Pour inclure des logos, créez un fichier ZIP contenant l'Excel et un dossier de
              logos.{' '}
            </p>{' '}
          </div>{' '}
        </div>{' '}
        <div className="flex items-start gap-3">
          {' '}
          <Building2 className="w-5 h-5 text-primary mt-0.5" />{' '}
          <div>
            {' '}
            <h4 className="font-medium mb-1">Logos</h4>{' '}
            <p className="text-sm text-muted-foreground">
              {' '}
              Les logos doivent être nommés avec le nom de l'entreprise
              (ex:"Entreprise_XYZ.png").{' '}
            </p>{' '}
          </div>{' '}
        </div>{' '}
      </div>{' '}
    </Card>
  );
}
