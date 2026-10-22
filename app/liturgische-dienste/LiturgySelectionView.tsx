import { useLoading } from "@/app/(shared)/UseLoading";
import { cn } from "@/app/(shared)/utils";
import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { getAllowedRoles } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";
import { resolveAvailableLiturgies } from "@/app/liturgische-dienste/resolveAvailableLiturgies";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { useUserStore } from "@/store/UserStore";
import { CpLiturgyRosterPosition } from "@/util/cockpit.generated";
import { useState } from "react";
import { PiCheck, PiSpinner } from "react-icons/pi";

export function LiturgySelectionView(props: { calendarEvent: CalendarEvent }) {
  const isPlanner = useUserStore((state) =>
    getAllowedRoles(state.person, "planner").includes(
      CpLiturgyRosterPosition.READER1,
    ),
  );
  const [upsertLiturgy, liturgies, activeLiturgy] = useLiturgyRoster(
    (state) => [
      state.upsertLiturgy,
      resolveAvailableLiturgies(state.liturgies, props.calendarEvent),
      state.liturgyEvents.find(
        (event) => event.eventId === props.calendarEvent.id,
      ),
    ],
  );
  const { loading, placeholder, whileLoading } = useLoading();

  function select(liturgy: Omit<Liturgy, "date">) {
    if (activeLiturgy?.liturgyName !== liturgy.name)
      whileLoading(
        upsertLiturgy(
          props.calendarEvent.id,
          props.calendarEvent.date,
          liturgy.name,
        ),
        liturgy.name,
      ).then();
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  return (
    (!!activeLiturgy || isPlanner) && (
      <div className="flex min-w-0 flex-col gap-1">
        <div className="text-xs text-black/50 lg:hidden">Liturgie</div>
        <div className={cn("min-w-0", isPlanner ? "" : "pointer-events-none")}>
          <Popover open={open} onOpenChange={setOpen} defaultOpen={true}>
            <PopoverTrigger asChild>
              <Button
                variant={isPlanner ? "outline" : "ghost"}
                role="combobox"
                aria-expanded={open}
                className="line-clamp-1 flex h-8 w-full flex-row justify-start text-left text-sm font-normal shadow-none"
              >
                {loading ? (
                  <>
                    {placeholder}{" "}
                    <PiSpinner className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                  </>
                ) : (
                  (activeLiturgy?.liturgyName ?? (
                    <div className="opacity-40">Liturgie wählen...</div>
                  ))
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {liturgies.map((liturgy) => (
                      <CommandItem
                        key={liturgy.name}
                        value={liturgy.name}
                        onSelect={() => select(liturgy)}
                      >
                        <PiCheck
                          className={cn(
                            "mr-2 h-4 w-4",
                            activeLiturgy?.liturgyName === liturgy.name
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {liturgy.name} ({liturgy.rank})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )
  );
}
