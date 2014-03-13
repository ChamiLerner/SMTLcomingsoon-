<?php


	error_reporting (E_ALL ^ E_NOTICE);
	$post = (!empty($_POST)) ? true : false;

if($post)
	{
		include 'functions.php';
		
		$email = trim($_POST['email']);
		

		$error = '';


// Check email
if(!$email)
	{
		$error .= 'I think you forget to enter your e-mail id.<br />';
	}
if($email && !ValidateEmail($email))
	{
		$error .= 'Invalid E-mail id !!!<br />';
	}
if(!$error)
	{
	
	  $pfileName	= "myemails.txt";
      $MyFile 	= fopen($pfileName, "a");
      $nline=$email.','."\r\n";		
     // USE THIS TO SAVE ONLY THE EMAIL: $nline=$email."\r\n";
      fwrite($MyFile, $nline);
      fclose($MyFile);
      echo 'Thank you for subscribing';	// Change the message if you want.
      die;	
			
			
			
if($mail)
	{
		echo 'OK';
	}
}
else
	{
		echo '<div class="notification_error">'.$error.'</div>';
	}
}
?>