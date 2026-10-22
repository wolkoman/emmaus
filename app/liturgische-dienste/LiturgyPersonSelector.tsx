import { useLoading } from "@/app/(shared)/UseLoading";
import { cn } from "@/app/(shared)/utils";
import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { getAllowedRoles } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";
import { LiturgyPerson } from "@/app/liturgische-dienste/LiturgyPerson";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUserStore } from "@/store/UserStore";
import {
  CpLiturgyRoster,
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
  CpPerson,
} from "@/util/cockpit.generated";
import { useState } from "react";
import { PiCheck } from "react-icons/pi";

export function LiturgyPersonSelector(props: {
  position: CpLiturgyRosterPosition;
  roster?: CpLiturgyRoster;
  liturgyEventId: string;
}) {
  const [_transfer, allUsers, users, _upsert, _cancel] = useLiturgyRoster(
    (state) => [
      state.transfer,
      state.persons,
      state.getUsers(props.position, props.liturgyEventId),
      state.upsert,
      state.cancel,
    ],
  );
  const [isSameRole, isPlanner, person] = useUserStore((state) => [
    getAllowedRoles(state.person, "self").includes(props.position),
    getAllowedRoles(state.person, "planner").includes(props.position),
    state.person,
  ]);
  const { loading, whileLoading, placeholder } = useLoading();

  async function select(person: CpPerson | null) {
    return whileLoading(
      _upsert(props.liturgyEventId, props.position, person?._id ?? null),
      person?.name,
    );
  }

  const [open, setOpen] = useState(false);
  const isTransferable =
    isSameRole && props.roster?.status === CpLiturgyRosterStatus.Cancelled;
  const isCancellable =
    props.roster?.userId === person?._id &&
    props.roster?.status !== CpLiturgyRosterStatus.Cancelled;
  const isOpenable = isPlanner || isTransferable || isCancellable;

  return (
    <div className={cn("contents", isOpenable ? "" : "pointer-events-none")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={isOpenable ? "outline" : "ghost"}
            role="combobox"
            aria-expanded={open}
            className="h-8 w-full justify-between py-0 text-sm font-normal shadow-none"
          >
            <LiturgyPerson
              override={placeholder}
              isOverriding={loading}
              name={allUsers.find((p) => p._id === props.roster?.userId)?.name}
              status={props.roster?.status}
              reminderSent={props.roster?.reminderSent}
              showPlaceholder={isPlanner}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            {isPlanner && (
              <>
                <CommandInput placeholder="Person suchen.." />
                <CommandEmpty>Keine Person gefunden.</CommandEmpty>
              </>
            )}
            <CommandList>
              {isPlanner && (
                <CommandGroup>
                  <CommandItem
                    value="noone"
                    onSelect={() => {
                      if (props.roster !== undefined) select(null).then();
                      setOpen(false);
                    }}
                  >
                    {" "}
                    <PiCheck className={"mr-2 h-4 w-4 opacity-0"} />
                    Niemand
                  </CommandItem>
                  {users.map((person) => (
                    <CommandItem
                      key={person._id}
                      value={person.name}
                      onSelect={() => {
                        if (person._id !== props.roster?.userId)
                          select(person).then();
                        setOpen(false);
                      }}
                    >
                      <PiCheck
                        className={cn(
                          "mr-2 h-4 w-4",
                          props.roster?.userId === person._id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {person.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {(isTransferable || isCancellable) && (
                <CommandGroup heading="Aktionen">
                  {isTransferable && (
                    <CommandItem
                      value="transfer"
                      onSelect={() => {
                        setOpen(false);
                        whileLoading(
                          _transfer(props.liturgyEventId, props.position),
                          person?.name,
                        );
                      }}
                    >
                      Dienst übernehmen
                    </CommandItem>
                  )}
                  {isCancellable && (
                    <CommandItem
                      value="cancel"
                      onSelect={() => {
                        setOpen(false);
                        whileLoading(
                          _cancel(props.liturgyEventId, props.position),
                          person?.name,
                        );
                      }}
                    >
                      Dienst absagen
                    </CommandItem>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
