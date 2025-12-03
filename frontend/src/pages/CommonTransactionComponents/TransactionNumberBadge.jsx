import { Badge } from "@/components/ui/badge";

const TransactionNumberBadge = ({ transactionNumber }) => {
  return (
    <div>
      <Badge
        variant="default"
        className="bg-gray-400 !text-[10px] rounded-[3px]"
      >
        {transactionNumber}
      </Badge>
    </div>
  );
};

export default TransactionNumberBadge;
