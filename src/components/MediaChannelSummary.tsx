
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ChannelSummary } from "@/types";

interface MediaChannelSummaryProps {
  channelSummaries: ChannelSummary[];
}

const MediaChannelSummary = ({ channelSummaries }: MediaChannelSummaryProps) => {
  const totalPlanned = channelSummaries.reduce((sum, ch) => sum + ch.planned, 0);
  const totalActual = channelSummaries.reduce((sum, ch) => sum + ch.actual, 0);
  const totalVariance = totalActual - totalPlanned;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Récapitulatif par Levier</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Levier</TableHead>
              <TableHead className="text-right">Budget Prévu</TableHead>
              <TableHead className="text-right">Budget Réel</TableHead>
              <TableHead className="text-right">Écart</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelSummaries.map((summary) => {
              const variance = summary.actual - summary.planned;
              const percentage = summary.planned > 0 
                ? ((variance) / summary.planned) * 100 
                : 0;
              
              return (
                <TableRow key={summary.channel}>
                  <TableCell className="font-medium">{summary.channel}</TableCell>
                  <TableCell className="text-right">{formatCurrency(summary.planned)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(summary.actual)}</TableCell>
                  <TableCell className={`text-right ${variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : ''}`}>
                    {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                  </TableCell>
                  <TableCell className={`text-right ${variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : ''}`}>
                    {variance > 0 ? '+' : ''}{percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-bold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">{formatCurrency(totalPlanned)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totalActual)}</TableCell>
              <TableCell className={`text-right ${totalVariance > 0 ? 'text-red-600' : totalVariance < 0 ? 'text-green-600' : ''}`}>
                {totalVariance > 0 ? '+' : ''}{formatCurrency(totalVariance)}
              </TableCell>
              <TableCell className={`text-right ${totalVariance > 0 ? 'text-red-600' : totalVariance < 0 ? 'text-green-600' : ''}`}>
                {totalVariance > 0 ? '+' : ''}{((totalVariance / totalPlanned) * 100).toFixed(1)}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MediaChannelSummary;
