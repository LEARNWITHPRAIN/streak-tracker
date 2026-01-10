import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Shield, Sword, Crown, Loader2 } from 'lucide-react';

interface MyArmyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Rank = {
  name: string;
  icon: typeof Shield;
  minRecruits: number;
  color: string;
};

const RANKS: Rank[] = [
  { name: 'Lone Yodha', icon: Shield, minRecruits: 0, color: 'text-muted-foreground' },
  { name: 'Squad Leader', icon: Users, minRecruits: 1, color: 'text-blue-400' },
  { name: 'Platoon Commander', icon: Sword, minRecruits: 5, color: 'text-purple-400' },
  { name: 'Warlord', icon: Crown, minRecruits: 20, color: 'text-primary' },
];

const getRank = (armySize: number): Rank => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (armySize >= RANKS[i].minRecruits) {
      return RANKS[i];
    }
  }
  return RANKS[0];
};

const getNextRank = (armySize: number): { rank: Rank; recruitsNeeded: number } | null => {
  for (const rank of RANKS) {
    if (armySize < rank.minRecruits) {
      return { rank, recruitsNeeded: rank.minRecruits - armySize };
    }
  }
  return null;
};

export const MyArmyModal = ({ open, onOpenChange }: MyArmyModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [armySize, setArmySize] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchArmyData();
    }
  }, [open, user]);

  const fetchArmyData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('army_size, referral_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setArmySize(data.army_size || 0);
        setReferralCode(data.referral_code);
      }
    } catch (error) {
      console.error('Error fetching army data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralCode) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: 'Link copied!',
        description: 'Share this link to recruit warriors to your army.',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const currentRank = getRank(armySize);
  const nextRankInfo = getNextRank(armySize);
  const RankIcon = currentRank.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">My Army</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Rank Badge */}
            <div className="flex flex-col items-center gap-3">
              <div className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ${currentRank.color}`}>
                <RankIcon className="w-10 h-10" />
              </div>
              <div className="text-center">
                <p className={`text-xl font-bold ${currentRank.color}`}>{currentRank.name}</p>
                {nextRankInfo && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {nextRankInfo.recruitsNeeded} more to become {nextRankInfo.rank.name}
                  </p>
                )}
              </div>
            </div>

            {/* Army Size Counter */}
            <div className="bg-muted/50 rounded-2xl p-6 text-center">
              <p className="text-6xl font-black text-primary glow-primary">{armySize}</p>
              <p className="text-muted-foreground mt-2 font-medium">
                {armySize === 1 ? 'Recruit' : 'Recruits'}
              </p>
            </div>

            {/* Progress to next rank */}
            {nextRankInfo && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress to {nextRankInfo.rank.name}</span>
                  <span>{armySize}/{nextRankInfo.rank.minRecruits}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ 
                      width: `${Math.min((armySize / nextRankInfo.rank.minRecruits) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Recruit Button */}
            <Button
              onClick={copyReferralLink}
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              disabled={!referralCode}
            >
              <Copy className="w-5 h-5 mr-2" />
              Recruit Warriors
            </Button>

            {/* Referral Link Display */}
            {referralCode && (
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Your referral link</p>
                <p className="text-sm font-mono text-foreground break-all">
                  {window.location.origin}/auth?ref={referralCode}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
