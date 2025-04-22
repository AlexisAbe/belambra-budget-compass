import React, { useState, useEffect } from 'react';
import { useCampaigns } from '@/context/CampaignContext';
import { fetchCampaignVersions } from '@/lib/supabaseUtils';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History } from 'lucide-react';

interface CampaignVersionsProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CampaignVersions: React.FC<CampaignVersionsProps> = ({ campaignId, open, onOpenChange }) => {
  const { createVersion } = useCampaigns();
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [showNewVersionForm, setShowNewVersionForm] = useState(false);

  useEffect(() => {
    if (open && campaignId) {
      loadVersions();
    }
  }, [open, campaignId]);

  const loadVersions = async () => {
    setLoading(true);
    const versionData = await fetchCampaignVersions(campaignId);
    setVersions(versionData);
    setLoading(false);
  };

  const handleCreateVersion = async () => {
    if (!newVersionName.trim()) {
      toast.error("Veuillez donner un nom à la version");
      return;
    }

    const success = await createVersion(
      campaignId, 
      newVersionName, 
      newVersionNotes.trim() || undefined
    );

    if (success) {
      loadVersions();
      setNewVersionName('');
      setNewVersionNotes('');
      setShowNewVersionForm(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    toast.info("La fonctionnalité de restauration de version sera bientôt disponible");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-2xl">Historique des versions</DrawerTitle>
          <DrawerDescription>
            Consultez l'historique des modifications de cette campagne et créez des points de sauvegarde.
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="overflow-y-auto px-4">
          {!showNewVersionForm ? (
            <Button 
              className="mb-4 w-full bg-belambra-blue hover:bg-belambra-darkBlue"
              onClick={() => setShowNewVersionForm(true)}
            >
              Créer une nouvelle version
            </Button>
          ) : (
            <div className="border p-4 rounded-md mb-4 bg-gray-50">
              <h3 className="font-medium mb-2">Nouvelle version</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="version-name" className="text-sm font-medium block mb-1">
                    Nom de la version*
                  </label>
                  <Input 
                    id="version-name"
                    value={newVersionName} 
                    onChange={e => setNewVersionName(e.target.value)}
                    placeholder="ex: Version finale avril 2025"
                  />
                </div>
                <div>
                  <label htmlFor="version-notes" className="text-sm font-medium block mb-1">
                    Notes (optionnel)
                  </label>
                  <Textarea 
                    id="version-notes"
                    value={newVersionNotes} 
                    onChange={e => setNewVersionNotes(e.target.value)}
                    placeholder="Décrivez les changements apportés..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setShowNewVersionForm(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateVersion}>
                    Enregistrer la version
                  </Button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center border rounded-md bg-gray-50">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Aucune version trouvée</h3>
              <p className="text-gray-500 mt-1">
                Les versions sont créées automatiquement à chaque modification de la campagne ou manuellement.
              </p>
            </div>
          ) : (
            <Table>
              <TableCaption>Historique des versions de la campagne</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map(version => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      {formatDate(version.version_date)}
                    </TableCell>
                    <TableCell>{version.version_name || 'Version sans nom'}</TableCell>
                    <TableCell>{formatCurrency(version.total_budget)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {version.version_notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRestoreVersion(version.id)}
                      >
                        Restaurer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Fermer</Button>
          </DrawerClose>
          <p className="text-xs text-center text-gray-500 mt-2">
            Les versions sont créées automatiquement à chaque modification de la campagne ou manuellement.
            <br />
            Les versions manuelles permettent de créer des points de sauvegarde que vous pourrez restaurer.
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CampaignVersions;
