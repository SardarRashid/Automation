
import re

filepath = "Job-Portal/src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Change handleScanEmailsWithToken signature
old_sig = """  const handleScanEmailsWithToken = async (token: string) => {
    setIsScanningEmails(true);
    showToast("Reading your latest Gmail responses for recruiter rejections...", "info");"""
new_sig = """  const handleScanEmailsWithToken = async (token: string, silent: boolean = false) => {
    setIsScanningEmails(true);
    if (!silent) showToast("Reading your latest Gmail responses for recruiter rejections...", "info");"""

content = content.replace(old_sig, new_sig)

# Change the "No emails found" toast
old_no_emails = """      if (messages.length === 0) {
        setIsScanningEmails(false);
        showToast("No emails found in mailbox.", "info");
        return;
      }"""
new_no_emails = """      if (messages.length === 0) {
        setIsScanningEmails(false);
        if (!silent) showToast("No emails found in mailbox.", "info");
        return;
      }"""
content = content.replace(old_no_emails, new_no_emails)

# Change the catch error toast
old_catch = """    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Failed to scan emails.", "error");
    } finally {"""
new_catch = """    } catch (err: any) {
      console.error(err);
      if (!silent) showToast(err?.message || "Failed to scan emails.", "error");
    } finally {"""
content = content.replace(old_catch, new_catch)

# Change the final success toast
old_success = """      setEmailResponses(processed);
      showToast(`Scanned and mapped ${processed.length} recent recruiter emails.`, "success");
    } catch (err: any) {"""
new_success = """      setEmailResponses(processed);
      if (!silent) showToast(`Scanned and mapped ${processed.length} recent recruiter emails.`, "success");
      else if (processed.length > emailResponses.length) showToast(`Background sync: Found new recruiter emails!`, "success");
    } catch (err: any) {"""
content = content.replace(old_success, new_success)

# Now inject the useEffect for background polling
use_effect_block = """  // Background email sync polling
  useEffect(() => {
    if (!googleToken) return;
    
    // Poll every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      handleScanEmailsWithToken(googleToken, true);
    }, 300000);
    
    return () => clearInterval(intervalId);
  }, [googleToken]);

  // Auth state observer"""

content = content.replace("  // Auth state observer", use_effect_block)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Added background polling")

