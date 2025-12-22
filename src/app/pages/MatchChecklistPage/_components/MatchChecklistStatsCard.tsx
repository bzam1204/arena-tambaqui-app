import { Shield, Users } from 'lucide-react';

type MatchChecklistStatsCardProps = {
  subscriptionCount: number;
  rentEquipmentCount: number;
  isAdmin: boolean;
};

export function MatchChecklistStatsCard({
  subscriptionCount,
  rentEquipmentCount,
  isAdmin,
}: MatchChecklistStatsCardProps) {
  return (
    <div className="clip-tactical-card bg-[#141A26] border-x-4 border-[#2D3A52]">
      <div className="flex flex-col">
        <div className="p-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#E6F1FF]" />
          <span className="text-xs text-nowrap font-mono-technical text-[#E6F1FF]">
            [ TOTAL INSCRITOS: {subscriptionCount} ]
          </span>
        </div>
        {isAdmin ? (
          <>
            <hr className="border-[#2D3A52]" />
            <div className="p-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-xs font-mono-technical text-[#00F0FF]">
                [ EQUIPAMENTO SOLICITADO: {rentEquipmentCount} ]
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
